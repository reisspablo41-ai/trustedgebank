-- ============================================================================
-- TRUST EDGE BANK MONEY-SEND SYSTEM - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- This schema implements a full money transfer system with:
-- - Internal transfers (1 business day settlement)
-- - Interbank/ACH transfers (3-5 business day settlement)
-- - Double-entry ledger accounting
-- - Pending holds and available balance tracking
-- - Savings transfer limits (6/month)
-- - Idempotency and concurrency safety
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTERNAL ACCOUNTS TABLE
-- Store external bank accounts for interbank transfers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS external_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES bank_users(id) ON DELETE CASCADE,
  
  -- Bank details
  bank_name text NOT NULL,
  account_holder_name text NOT NULL,
  account_number_last4 text NOT NULL, -- only store last 4 digits for display
  routing_number text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('checking', 'savings')),
  
  -- Verification
  is_verified boolean DEFAULT false,
  verification_method text, -- 'micro_deposits', 'instant', 'manual'
  verified_at timestamptz,
  
  -- Metadata
  nickname text, -- e.g., "Mom's Bank Account"
  is_default boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_account_number_last4 CHECK (length(account_number_last4) = 4)
);

CREATE INDEX idx_external_accounts_user_id ON external_accounts(user_id);
CREATE INDEX idx_external_accounts_verified ON external_accounts(user_id, is_verified);

-- ----------------------------------------------------------------------------
-- 2. TRANSFERS TABLE
-- Main transfer records tracking all money movements
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text UNIQUE NOT NULL, -- prevent duplicate transfers
  
  -- User and accounts
  user_id uuid NOT NULL REFERENCES bank_users(id) ON DELETE RESTRICT,
  from_account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  to_account_id uuid REFERENCES accounts(id) ON DELETE RESTRICT, -- nullable for external
  external_account_id uuid REFERENCES external_accounts(id) ON DELETE RESTRICT,
  
  -- Transfer details
  transfer_type text NOT NULL CHECK (transfer_type IN ('internal', 'interbank')),
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  fee numeric(18,2) DEFAULT 0 CHECK (fee >= 0),
  currency text DEFAULT 'USD',
  
  -- Status tracking
  status text NOT NULL DEFAULT 'initiated' CHECK (status IN (
    'initiated',      -- just created
    'pending',        -- hold created, awaiting settlement
    'processing',     -- sent to settlement queue/ACH
    'settled',        -- completed successfully
    'failed',         -- failed before or during settlement
    'cancelled',      -- user cancelled before processing
    'reversed'        -- settled but later reversed
  )),
  
  -- User-facing info
  description text,
  memo text,
  reference text, -- transaction reference for tracking
  
  -- Settlement timing
  scheduled_settlement_at timestamptz, -- when settlement is expected
  processed_at timestamptz,            -- when sent to processing
  settled_at timestamptz,              -- when finally settled
  
  -- Failure tracking
  failure_reason text,
  failure_code text,
  
  -- External transfer details (ACH)
  external_details jsonb DEFAULT '{}', -- routing, account, bank name, etc.
  ach_trace_number text,              -- ACH network trace ID
  
  -- MFA/verification
  requires_verification boolean DEFAULT false,
  verified_at timestamptz,
  verification_method text, -- 'otp', 'biometric', etc.
  
  -- Metadata
  device_info jsonb DEFAULT '{}',
  ip_address inet,
  metadata jsonb DEFAULT '{}',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_transfer_destination CHECK (
    (transfer_type = 'internal' AND to_account_id IS NOT NULL AND external_account_id IS NULL) OR
    (transfer_type = 'interbank' AND to_account_id IS NULL AND external_account_id IS NOT NULL)
  )
);

CREATE INDEX idx_transfers_user_id ON transfers(user_id);
CREATE INDEX idx_transfers_from_account ON transfers(from_account_id);
CREATE INDEX idx_transfers_to_account ON transfers(to_account_id);
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_transfers_created_at ON transfers(created_at DESC);
CREATE INDEX idx_transfers_idempotency ON transfers(idempotency_key);
CREATE INDEX idx_transfers_settlement ON transfers(scheduled_settlement_at) WHERE status IN ('pending', 'processing');

-- ----------------------------------------------------------------------------
-- 3. HOLDS TABLE
-- Track pending balances that reduce available_balance
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  transfer_id uuid REFERENCES transfers(id) ON DELETE SET NULL,
  
  -- Hold details
  amount numeric(18,2) NOT NULL CHECK (amount >= 0),
  hold_type text NOT NULL CHECK (hold_type IN ('outgoing', 'incoming')),
  
  -- Status
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released', 'settled')),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  released_at timestamptz,
  expires_at timestamptz, -- auto-release if not settled by this time
  
  -- Metadata
  description text,
  metadata jsonb DEFAULT '{}'
);

CREATE INDEX idx_holds_account_id ON holds(account_id);
CREATE INDEX idx_holds_transfer_id ON holds(transfer_id);
CREATE INDEX idx_holds_status ON holds(account_id, status) WHERE status = 'active';
CREATE INDEX idx_holds_expires ON holds(expires_at) WHERE status = 'active';

-- ----------------------------------------------------------------------------
-- 4. LEDGER ENTRIES TABLE
-- Immutable double-entry ledger for all account movements
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to source
  transfer_id uuid REFERENCES transfers(id) ON DELETE RESTRICT,
  transaction_id uuid REFERENCES transactions(id) ON DELETE RESTRICT,
  
  -- Account and entry
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  entry_type text NOT NULL CHECK (entry_type IN ('debit', 'credit')),
  
  -- Amount and balance
  amount numeric(18,2) NOT NULL CHECK (amount >= 0),
  balance_after numeric(18,2) NOT NULL,
  
  -- Categorization
  category text, -- 'transfer', 'fee', 'interest', 'reversal', etc.
  description text,
  
  -- Status (pending ledger entries become final on settlement)
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'reversed')),
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  
  created_at timestamptz DEFAULT now(),
  posted_at timestamptz
);

CREATE INDEX idx_ledger_account_id ON ledger_entries(account_id);
CREATE INDEX idx_ledger_transfer_id ON ledger_entries(transfer_id);
CREATE INDEX idx_ledger_created_at ON ledger_entries(created_at DESC);
CREATE INDEX idx_ledger_status ON ledger_entries(account_id, status);

-- Prevent updates and deletes (immutable ledger)
CREATE OR REPLACE FUNCTION prevent_ledger_modifications()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Ledger entries are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_ledger_update
  BEFORE UPDATE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modifications();

CREATE TRIGGER prevent_ledger_delete
  BEFORE DELETE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modifications();

-- ----------------------------------------------------------------------------
-- 5. TRANSFER EVENTS TABLE
-- Timeline/history of all status changes for a transfer
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transfer_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  
  -- Event details
  event_type text NOT NULL, -- 'status_change', 'notification_sent', 'verification_requested', etc.
  from_status text,
  to_status text,
  
  -- Description
  description text,
  details jsonb DEFAULT '{}',
  
  -- Actor
  actor_id uuid, -- user or admin who triggered this event
  actor_type text DEFAULT 'system', -- 'user', 'admin', 'system', 'worker'
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_transfer_events_transfer_id ON transfer_events(transfer_id);
CREATE INDEX idx_transfer_events_created_at ON transfer_events(created_at DESC);

-- ----------------------------------------------------------------------------
-- 6. TRANSFER LIMITS TABLE
-- Configurable limits per account tier or user
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transfer_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Scope
  account_tier text DEFAULT 'standard', -- 'standard', 'premium', 'business'
  user_id uuid REFERENCES bank_users(id) ON DELETE CASCADE, -- override for specific user
  
  -- Limits
  per_transaction_min numeric(18,2) DEFAULT 0.01,
  per_transaction_max numeric(18,2) DEFAULT 10000.00,
  daily_limit numeric(18,2) DEFAULT 5000.00,
  monthly_limit numeric(18,2),
  
  -- Internal vs External
  internal_per_transaction_max numeric(18,2),
  interbank_per_transaction_max numeric(18,2),
  
  -- Verification thresholds
  verification_threshold numeric(18,2) DEFAULT 1000.00, -- require MFA above this
  
  -- Savings limits
  savings_monthly_transfer_limit int DEFAULT 6,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Default limits
INSERT INTO transfer_limits (account_tier, per_transaction_max, daily_limit, verification_threshold)
VALUES ('standard', 10000.00, 5000.00, 1000.00)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. UPDATE ACCOUNTS TABLE
-- Add pending_balance and available_balance fields
-- ----------------------------------------------------------------------------
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS pending_balance numeric(18,2) DEFAULT 0;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS available_balance numeric(18,2) DEFAULT 0;

-- Update existing accounts to set available_balance = balance
UPDATE accounts SET available_balance = balance WHERE available_balance = 0 OR available_balance IS NULL;

-- ----------------------------------------------------------------------------
-- 8. HELPER FUNCTIONS
-- ----------------------------------------------------------------------------

-- Function to calculate available balance dynamically
CREATE OR REPLACE FUNCTION calculate_available_balance(account_uuid uuid)
RETURNS numeric AS $$
DECLARE
  account_balance numeric;
  total_holds numeric;
BEGIN
  -- Get account balance
  SELECT balance INTO account_balance FROM accounts WHERE id = account_uuid;
  
  -- Sum active outgoing holds
  SELECT COALESCE(SUM(amount), 0) INTO total_holds
  FROM holds
  WHERE account_id = account_uuid
    AND status = 'active'
    AND hold_type = 'outgoing';
  
  RETURN account_balance - total_holds;
END;
$$ LANGUAGE plpgsql;

-- Function to count savings transfers in last 30 days
CREATE OR REPLACE FUNCTION count_savings_transfers(account_uuid uuid, days int DEFAULT 30)
RETURNS int AS $$
DECLARE
  transfer_count int;
  account_type_check text;
BEGIN
  -- Verify account is savings
  SELECT account_type INTO account_type_check FROM accounts WHERE id = account_uuid;
  
  IF account_type_check != 'savings' THEN
    RETURN 0;
  END IF;
  
  -- Count transfers from this savings account in last N days
  SELECT COUNT(*) INTO transfer_count
  FROM transfers
  WHERE from_account_id = account_uuid
    AND status NOT IN ('cancelled', 'failed')
    AND created_at >= now() - (days || ' days')::interval;
  
  RETURN transfer_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check if amount exceeds daily limit
CREATE OR REPLACE FUNCTION check_daily_limit(user_uuid uuid, amount_to_transfer numeric)
RETURNS boolean AS $$
DECLARE
  daily_limit numeric;
  today_total numeric;
BEGIN
  -- Get user's daily limit
  SELECT COALESCE(tl.daily_limit, 5000.00) INTO daily_limit
  FROM transfer_limits tl
  WHERE tl.user_id = user_uuid OR tl.account_tier = 'standard'
  ORDER BY tl.user_id DESC NULLS LAST
  LIMIT 1;
  
  -- Sum today's transfers
  SELECT COALESCE(SUM(amount), 0) INTO today_total
  FROM transfers
  WHERE user_id = user_uuid
    AND status IN ('pending', 'processing', 'settled')
    AND created_at >= date_trunc('day', now());
  
  RETURN (today_total + amount_to_transfer) <= daily_limit;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 9. TRIGGER: Auto-update available_balance when holds change
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_available_balance_on_hold()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate and update available_balance
  UPDATE accounts
  SET available_balance = calculate_available_balance(
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.account_id
      ELSE NEW.account_id
    END
  )
  WHERE id = CASE
    WHEN TG_OP = 'DELETE' THEN OLD.account_id
    ELSE NEW.account_id
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_available_balance_on_hold
  AFTER INSERT OR UPDATE OR DELETE ON holds
  FOR EACH ROW
  EXECUTE FUNCTION update_available_balance_on_hold();

-- ----------------------------------------------------------------------------
-- 10. TRIGGER: Auto-create transfer events on status change
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_transfer_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO transfer_events (transfer_id, event_type, to_status, description)
    VALUES (NEW.id, 'status_change', NEW.status, 'Transfer created');
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO transfer_events (transfer_id, event_type, from_status, to_status, description)
    VALUES (NEW.id, 'status_change', OLD.status, NEW.status, 'Status updated from ' || OLD.status || ' to ' || NEW.status);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_transfer_status
  AFTER INSERT OR UPDATE ON transfers
  FOR EACH ROW
  EXECUTE FUNCTION log_transfer_status_change();

-- ----------------------------------------------------------------------------
-- 11. TRIGGER: Update timestamps
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transfers_updated_at
  BEFORE UPDATE ON transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_external_accounts_updated_at
  BEFORE UPDATE ON external_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

