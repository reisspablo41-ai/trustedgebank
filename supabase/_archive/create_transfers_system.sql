-- =====================================================
-- TRUST EDGE BANK - TRANSFERS & MONEY SEND SYSTEM
-- Complete database schema for internal and interbank transfers
-- =====================================================

-- =====================================================
-- 1. TRANSFERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES bank_users(id) ON DELETE CASCADE,
  from_account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  to_account_id uuid REFERENCES accounts(id) ON DELETE RESTRICT, -- NULL for external
  
  -- External transfer details (for interbank)
  external_bank_name text,
  external_routing_number text,
  external_account_number text,
  external_account_holder_name text,
  
  -- Amount details
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  fee numeric(18,2) NOT NULL DEFAULT 0 CHECK (fee >= 0),
  currency text NOT NULL DEFAULT 'USD',
  
  -- Transfer metadata
  transfer_type text NOT NULL CHECK (transfer_type IN ('internal', 'interbank')),
  status text NOT NULL DEFAULT 'initiated' CHECK (status IN (
    'initiated',
    'pending',
    'processing',
    'settled',
    'failed',
    'cancelled',
    'reversed'
  )),
  
  -- User-provided info
  memo text,
  reference text, -- System-generated reference ID for tracking
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  scheduled_settlement_at timestamptz,
  settled_at timestamptz,
  
  -- Failure handling
  failure_reason text,
  retry_count int NOT NULL DEFAULT 0,
  
  -- MFA/Security
  requires_mfa boolean NOT NULL DEFAULT false,
  mfa_verified boolean NOT NULL DEFAULT false,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Indexes for transfers
CREATE INDEX IF NOT EXISTS idx_transfers_user_id ON transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_transfers_from_account ON transfers(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_account ON transfers(to_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON transfers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_idempotency ON transfers(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_transfers_settlement ON transfers(scheduled_settlement_at) 
  WHERE status IN ('pending', 'processing');

-- =====================================================
-- 2. HOLDS / PENDING BALANCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  transfer_id uuid NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  hold_type text NOT NULL CHECK (hold_type IN ('outgoing', 'incoming')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released', 'settled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz,
  settled_at timestamptz
);

-- Indexes for holds
CREATE INDEX IF NOT EXISTS idx_holds_account_id ON holds(account_id);
CREATE INDEX IF NOT EXISTS idx_holds_transfer_id ON holds(transfer_id);
CREATE INDEX IF NOT EXISTS idx_holds_status ON holds(status) WHERE status = 'active';

-- =====================================================
-- 3. LEDGER ENTRIES TABLE (Immutable, double-entry)
-- =====================================================
CREATE TABLE IF NOT EXISTS ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid REFERENCES transfers(id) ON DELETE RESTRICT,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES bank_users(id) ON DELETE CASCADE,
  
  -- Entry details
  entry_type text NOT NULL CHECK (entry_type IN ('debit', 'credit', 'hold', 'release')),
  amount numeric(18,2) NOT NULL CHECK (amount >= 0),
  balance_after numeric(18,2) NOT NULL,
  
  -- Transaction categorization
  category text NOT NULL CHECK (category IN (
    'transfer_out',
    'transfer_in',
    'transfer_hold',
    'transfer_release',
    'fee',
    'reversal'
  )),
  
  -- Metadata
  description text,
  reference text,
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for ledger (immutable, insert-only)
CREATE INDEX IF NOT EXISTS idx_ledger_account_id ON ledger_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_transfer_id ON ledger_entries(transfer_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON ledger_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_user_id ON ledger_entries(user_id);

-- =====================================================
-- 4. TRANSFER EVENTS TABLE (State change audit log)
-- =====================================================
CREATE TABLE IF NOT EXISTS transfer_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  from_status text NOT NULL,
  to_status text NOT NULL,
  event_type text NOT NULL, -- 'status_change', 'retry', 'notification_sent', etc.
  details text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES bank_users(id) -- NULL for system events
);

-- Index for events
CREATE INDEX IF NOT EXISTS idx_transfer_events_transfer_id ON transfer_events(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfer_events_created_at ON transfer_events(created_at DESC);

-- =====================================================
-- 5. UPDATE ACCOUNTS TABLE
-- Add pending_balance and available_balance tracking
-- =====================================================
-- Add columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'pending_balance'
  ) THEN
    ALTER TABLE accounts ADD COLUMN pending_balance numeric(18,2) NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'available_balance'
  ) THEN
    ALTER TABLE accounts ADD COLUMN available_balance numeric(18,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Update existing accounts to sync available = balance initially
UPDATE accounts SET available_balance = balance WHERE available_balance = 0;

-- =====================================================
-- 6. TRANSFER LIMITS TABLE (Configurable limits)
-- =====================================================
CREATE TABLE IF NOT EXISTS transfer_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_tier text NOT NULL DEFAULT 'standard', -- 'standard', 'premium', 'business'
  transfer_type text NOT NULL CHECK (transfer_type IN ('internal', 'interbank')),
  
  -- Per-transaction limits
  min_amount numeric(18,2) NOT NULL DEFAULT 1.00,
  max_amount numeric(18,2) NOT NULL DEFAULT 10000.00,
  
  -- Daily limits
  daily_transaction_limit int NOT NULL DEFAULT 10,
  daily_amount_limit numeric(18,2) NOT NULL DEFAULT 25000.00,
  
  -- Monthly limits (for savings)
  monthly_transaction_limit int, -- NULL = no limit (except savings federal limit)
  
  -- Fees
  flat_fee numeric(18,2) NOT NULL DEFAULT 0,
  percentage_fee numeric(5,4) NOT NULL DEFAULT 0, -- e.g., 0.0025 = 0.25%
  
  -- MFA threshold
  mfa_required_above numeric(18,2) DEFAULT 5000.00,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default limits
INSERT INTO transfer_limits (account_tier, transfer_type, max_amount, daily_amount_limit, flat_fee, percentage_fee)
VALUES 
  ('standard', 'internal', 50000.00, 100000.00, 0, 0),
  ('standard', 'interbank', 10000.00, 25000.00, 2.50, 0.0010),
  ('premium', 'internal', 100000.00, 250000.00, 0, 0),
  ('premium', 'interbank', 25000.00, 50000.00, 0, 0.0005),
  ('business', 'internal', 500000.00, 1000000.00, 0, 0),
  ('business', 'interbank', 100000.00, 250000.00, 0, 0.0002)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to calculate available balance
CREATE OR REPLACE FUNCTION calculate_available_balance(p_account_id uuid)
RETURNS numeric AS $$
DECLARE
  v_balance numeric;
  v_pending_outgoing numeric;
BEGIN
  -- Get current balance
  SELECT balance INTO v_balance
  FROM accounts
  WHERE id = p_account_id;
  
  -- Get total active outgoing holds
  SELECT COALESCE(SUM(amount), 0) INTO v_pending_outgoing
  FROM holds
  WHERE account_id = p_account_id
    AND hold_type = 'outgoing'
    AND status = 'active';
  
  RETURN v_balance - v_pending_outgoing;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check savings transfer limit (6/month federal regulation)
CREATE OR REPLACE FUNCTION check_savings_transfer_limit(p_account_id uuid)
RETURNS boolean AS $$
DECLARE
  v_account_type text;
  v_transfer_count int;
BEGIN
  -- Get account type
  SELECT account_type INTO v_account_type
  FROM accounts
  WHERE id = p_account_id;
  
  -- Only apply to savings accounts
  IF v_account_type != 'savings' THEN
    RETURN true;
  END IF;
  
  -- Count transfers in last 30 days
  SELECT COUNT(*) INTO v_transfer_count
  FROM transfers
  WHERE from_account_id = p_account_id
    AND created_at >= NOW() - INTERVAL '30 days'
    AND status NOT IN ('cancelled', 'failed')
    AND transfer_type IN ('internal', 'interbank');
  
  -- Federal limit is 6 per month
  RETURN v_transfer_count < 6;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate transfer reference
CREATE OR REPLACE FUNCTION generate_transfer_reference()
RETURNS text AS $$
DECLARE
  v_prefix text := 'FTZ';
  v_timestamp text;
  v_random text;
BEGIN
  v_timestamp := TO_CHAR(NOW(), 'YYMMDD');
  v_random := UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 8));
  RETURN v_prefix || v_timestamp || v_random;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate transfer fee
CREATE OR REPLACE FUNCTION calculate_transfer_fee(
  p_transfer_type text,
  p_amount numeric,
  p_account_tier text DEFAULT 'standard'
)
RETURNS numeric AS $$
DECLARE
  v_flat_fee numeric;
  v_percentage_fee numeric;
  v_calculated_fee numeric;
BEGIN
  SELECT flat_fee, percentage_fee INTO v_flat_fee, v_percentage_fee
  FROM transfer_limits
  WHERE account_tier = p_account_tier
    AND transfer_type = p_transfer_type
  LIMIT 1;
  
  IF NOT FOUND THEN
    v_flat_fee := 0;
    v_percentage_fee := 0;
  END IF;
  
  v_calculated_fee := v_flat_fee + (p_amount * v_percentage_fee);
  RETURN ROUND(v_calculated_fee, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- Trigger to update transfers.updated_at
CREATE OR REPLACE FUNCTION update_transfer_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_transfer_timestamp
BEFORE UPDATE ON transfers
FOR EACH ROW
EXECUTE FUNCTION update_transfer_timestamp();

-- Trigger to log transfer status changes
CREATE OR REPLACE FUNCTION log_transfer_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO transfer_events (transfer_id, from_status, to_status, event_type, details)
    VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      'status_change',
      'Status changed from ' || OLD.status || ' to ' || NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_transfer_status
AFTER UPDATE ON transfers
FOR EACH ROW
EXECUTE FUNCTION log_transfer_status_change();

-- Trigger to auto-generate transfer reference
CREATE OR REPLACE FUNCTION set_transfer_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference IS NULL THEN
    NEW.reference = generate_transfer_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_transfer_reference
BEFORE INSERT ON transfers
FOR EACH ROW
EXECUTE FUNCTION set_transfer_reference();

-- =====================================================
-- 9. RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_limits ENABLE ROW LEVEL SECURITY;

-- TRANSFERS POLICIES
-- Users can only see their own transfers
CREATE POLICY "Users can view own transfers"
ON transfers FOR SELECT
USING (user_id = auth.uid());

-- Users can create transfers from their own accounts
CREATE POLICY "Users can create own transfers"
ON transfers FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM accounts
    WHERE id = from_account_id
      AND user_id = auth.uid()
  )
);

-- Users can update their own initiated transfers (for cancellation)
CREATE POLICY "Users can update own initiated transfers"
ON transfers FOR UPDATE
USING (user_id = auth.uid() AND status = 'initiated')
WITH CHECK (user_id = auth.uid());

-- HOLDS POLICIES
CREATE POLICY "Users can view own holds"
ON holds FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM accounts
    WHERE id = holds.account_id
      AND user_id = auth.uid()
  )
);

-- LEDGER POLICIES (Read-only for users)
CREATE POLICY "Users can view own ledger entries"
ON ledger_entries FOR SELECT
USING (user_id = auth.uid());

-- TRANSFER EVENTS POLICIES
CREATE POLICY "Users can view own transfer events"
ON transfer_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM transfers
    WHERE id = transfer_events.transfer_id
      AND user_id = auth.uid()
  )
);

-- TRANSFER LIMITS (Public read)
CREATE POLICY "Anyone can view transfer limits"
ON transfer_limits FOR SELECT
USING (true);

-- =====================================================
-- 10. ADMIN POLICIES (Role-based)
-- =====================================================
-- Note: Requires admin role setup in Supabase auth

-- CREATE POLICY "Admins can view all transfers"
-- ON transfers FOR SELECT
-- USING (auth.jwt() ->> 'role' = 'admin');

-- CREATE POLICY "Admins can update all transfers"
-- ON transfers FOR UPDATE
-- USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Composite index for daily limit checks
CREATE INDEX IF NOT EXISTS idx_transfers_user_daily ON transfers(user_id, created_at)
  WHERE status NOT IN ('cancelled', 'failed');

-- Index for settlement worker queries
CREATE INDEX IF NOT EXISTS idx_transfers_pending_settlement ON transfers(scheduled_settlement_at, status)
  WHERE status IN ('pending', 'processing');

-- Index for savings limit checks
CREATE INDEX IF NOT EXISTS idx_transfers_savings_limit ON transfers(from_account_id, created_at)
  WHERE status NOT IN ('cancelled', 'failed');

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE transfers IS 'All money transfer records (internal and interbank)';
COMMENT ON TABLE holds IS 'Pending balance holds for in-flight transfers';
COMMENT ON TABLE ledger_entries IS 'Immutable double-entry ledger for all account movements';
COMMENT ON TABLE transfer_events IS 'Audit log of transfer state changes';
COMMENT ON TABLE transfer_limits IS 'Configurable transfer limits and fees by account tier';

COMMENT ON COLUMN transfers.idempotency_key IS 'Client-provided key to prevent duplicate transfers';
COMMENT ON COLUMN transfers.scheduled_settlement_at IS 'Expected settlement timestamp (1 day internal, 3-5 days interbank)';
COMMENT ON COLUMN holds.hold_type IS 'outgoing = sender hold, incoming = recipient pending credit';
COMMENT ON COLUMN ledger_entries.entry_type IS 'debit/credit/hold/release for double-entry accounting';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this migration in Supabase SQL Editor
-- Then run the RLS setup if using custom admin roles

