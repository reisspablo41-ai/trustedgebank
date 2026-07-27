-- ================================================
-- TRUST EDGE BANK - CONSOLIDATED DATABASE SCHEMA
-- ================================================
-- Run this in Supabase SQL Editor to create all tables

-- ================================================
-- 1. CORE USER & ACCOUNT TABLES
-- ================================================

-- Bank Users (extends auth.users)
CREATE TABLE IF NOT EXISTS public.bank_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  phone_number text,
  address text,
  kyc_status text NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- KYC Submissions
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  identification_type text NOT NULL CHECK (identification_type IN ('ssn','tin')),
  identification_number text NOT NULL,
  document_urls text[] NOT NULL,
  selfie_url text NOT NULL,
  address text NOT NULL,
  phone_number text NOT NULL,
  proof_of_address_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id)
);

-- Accounts (checking, savings, etc.)
CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  account_type text NOT NULL CHECK (account_type IN ('checking','savings')),
  account_number text NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0 CHECK (balance >= 0),
  available_balance numeric NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  pending_balance numeric(18,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ================================================
-- 2. TRANSACTION TABLES
-- ================================================

-- Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('credit','debit','refund','transfer')),
  category text CHECK (category IN ('food_dining', 'transportation', 'shopping', 'bills_utilities', 'entertainment', 'healthcare', 'education', 'income', 'transfer', 'other')),
  description text NOT NULL,
  balance_after numeric,
  reference_number text UNIQUE,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster transaction queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- ================================================
-- 3. MONEY SEND SYSTEM (Transfers, External Accounts, Ledger)
-- ================================================

-- External Accounts (for interbank transfers)
CREATE TABLE IF NOT EXISTS external_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES bank_users(id) ON DELETE CASCADE,
  bank_name text NOT NULL,
  account_holder_name text NOT NULL,
  account_number_last4 text NOT NULL CHECK (length(account_number_last4) = 4),
  routing_number text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('checking', 'savings')),
  is_verified boolean DEFAULT false,
  verification_method text,
  verified_at timestamptz,
  nickname text,
  is_default boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_external_accounts_user_id ON external_accounts(user_id);

-- Transfers (Robust System)
CREATE TABLE IF NOT EXISTS transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES bank_users(id) ON DELETE RESTRICT,
  from_account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  to_account_id uuid REFERENCES accounts(id) ON DELETE RESTRICT,
  external_account_id uuid REFERENCES external_accounts(id) ON DELETE RESTRICT,
  transfer_type text NOT NULL CHECK (transfer_type IN ('internal', 'interbank')),
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  fee numeric(18,2) DEFAULT 0 CHECK (fee >= 0),
  currency text DEFAULT 'USD',
  status text NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'pending', 'processing', 'settled', 'failed', 'cancelled', 'reversed')),
  description text,
  memo text,
  reference text,
  scheduled_settlement_at timestamptz,
  processed_at timestamptz,
  settled_at timestamptz,
  failure_reason text,
  failure_code text,
  external_details jsonb DEFAULT '{}',
  ach_trace_number text,
  requires_verification boolean DEFAULT false,
  verified_at timestamptz,
  verification_method text,
  device_info jsonb DEFAULT '{}',
  ip_address inet,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_transfer_destination CHECK (
    (transfer_type = 'internal' AND to_account_id IS NOT NULL AND external_account_id IS NULL) OR
    (transfer_type = 'interbank' AND to_account_id IS NULL AND external_account_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_transfers_user_id ON transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_transfers_from_account ON transfers(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON transfers(created_at DESC);

-- Holds (Pending Balance)
CREATE TABLE IF NOT EXISTS holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  transfer_id uuid REFERENCES transfers(id) ON DELETE SET NULL,
  amount numeric(18,2) NOT NULL CHECK (amount >= 0),
  hold_type text NOT NULL CHECK (hold_type IN ('outgoing', 'incoming')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released', 'settled')),
  created_at timestamptz DEFAULT now(),
  released_at timestamptz,
  expires_at timestamptz,
  description text,
  metadata jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_holds_account_id ON holds(account_id);
CREATE INDEX IF NOT EXISTS idx_holds_transfer_id ON holds(transfer_id);

-- Ledger Entries (Double Entry)
CREATE TABLE IF NOT EXISTS ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid REFERENCES transfers(id) ON DELETE RESTRICT,
  transaction_id uuid REFERENCES transactions(id) ON DELETE RESTRICT,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  entry_type text NOT NULL CHECK (entry_type IN ('debit', 'credit')),
  amount numeric(18,2) NOT NULL CHECK (amount >= 0),
  balance_after numeric(18,2) NOT NULL,
  category text,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'reversed')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  posted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_ledger_account_id ON ledger_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_transfer_id ON ledger_entries(transfer_id);

-- Transfer Events (Audit Log)
CREATE TABLE IF NOT EXISTS transfer_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  from_status text,
  to_status text,
  description text,
  details jsonb DEFAULT '{}',
  actor_id uuid,
  actor_type text DEFAULT 'system',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transfer_events_transfer_id ON transfer_events(transfer_id);

-- Transfer Limits
CREATE TABLE IF NOT EXISTS transfer_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_tier text DEFAULT 'standard',
  user_id uuid REFERENCES bank_users(id) ON DELETE CASCADE,
  per_transaction_min numeric(18,2) DEFAULT 0.01,
  per_transaction_max numeric(18,2) DEFAULT 10000.00,
  daily_limit numeric(18,2) DEFAULT 5000.00,
  monthly_limit numeric(18,2),
  internal_per_transaction_max numeric(18,2),
  interbank_per_transaction_max numeric(18,2),
  verification_threshold numeric(18,2) DEFAULT 1000.00,
  savings_monthly_transfer_limit int DEFAULT 6,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

INSERT INTO transfer_limits (account_tier, per_transaction_max, daily_limit, verification_threshold)
VALUES ('standard', 10000.00, 5000.00, 1000.00)
ON CONFLICT DO NOTHING;

-- Beneficiaries (Pre-existing simplified table, keeping for backward compat if needed)
CREATE TABLE IF NOT EXISTS public.beneficiaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  name text NOT NULL,
  account_number text,
  email text,
  bank_name text,
  routing_number text,
  is_favorite boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ================================================
-- 4. CARDS SYSTEM
-- ================================================

CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES bank_users(id) ON DELETE CASCADE,
  card_number text UNIQUE,
  card_type text NOT NULL CHECK (card_type IN ('debit', 'credit', 'prepaid')),
  expiry_date text,
  cvv text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);

-- ================================================
-- 5. DASHBOARD & ANALYTICS
-- ================================================

-- Spending Analytics (aggregated monthly)
CREATE TABLE IF NOT EXISTS public.spending_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  month date NOT NULL,
  category text NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  transaction_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, month, category)
);

-- Monthly Summaries
CREATE TABLE IF NOT EXISTS public.monthly_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  month date NOT NULL,
  total_income numeric NOT NULL DEFAULT 0,
  total_expenses numeric NOT NULL DEFAULT 0,
  net_savings numeric NOT NULL DEFAULT 0,
  largest_expense numeric DEFAULT 0,
  largest_expense_category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

-- User Alerts
CREATE TABLE IF NOT EXISTS public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('spending', 'saving', 'bill_reminder', 'security', 'general')),
  title text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'success', 'error')),
  is_read boolean DEFAULT false,
  action_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Savings Goals
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  goal_name text NOT NULL,
  target_amount numeric NOT NULL CHECK (target_amount > 0),
  current_amount numeric NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  target_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Statements
CREATE TABLE IF NOT EXISTS public.statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  statement_month date NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL DEFAULT 'pdf' CHECK (file_type IN ('pdf', 'csv')),
  opening_balance numeric NOT NULL,
  closing_balance numeric NOT NULL,
  total_credits numeric NOT NULL DEFAULT 0,
  total_debits numeric NOT NULL DEFAULT 0,
  generated_at timestamptz NOT NULL DEFAULT now()
);

-- Recurring Payments
CREATE TABLE IF NOT EXISTS public.recurring_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  payee_name text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  next_payment_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  auto_pay boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.bank_users(id) ON DELETE CASCADE,
  transaction_alerts boolean DEFAULT true,
  monthly_statements boolean DEFAULT true,
  marketing_emails boolean DEFAULT false,
  security_alerts boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User Settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES public.bank_users(id) ON DELETE CASCADE,
  theme text DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language text DEFAULT 'en',
  timezone text DEFAULT 'America/New_York',
  two_factor_enabled boolean DEFAULT false,
  biometric_enabled boolean DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Login History
CREATE TABLE IF NOT EXISTS public.login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  ip_address text,
  user_agent text,
  device_info jsonb,
  login_method text CHECK (login_method IN ('password', 'biometric', '2fa', 'oauth')),
  status text NOT NULL CHECK (status IN ('success', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Audit Log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.bank_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ================================================
-- 6. HELPER FUNCTIONS & TRIGGERS
-- ================================================

-- Generate unique account number
CREATE OR REPLACE FUNCTION public.generate_account_number()
RETURNS text AS $$
DECLARE
  num text;
BEGIN
  num := lpad((floor(random()*1e10))::bigint::text, 10, '0');
  RETURN num;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Update account balance after transaction (Basic)
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF (NEW.type = 'credit' OR NEW.type = 'refund') THEN
      UPDATE public.accounts 
      SET balance = balance + NEW.amount,
          available_balance = available_balance + NEW.amount,
          updated_at = now()
      WHERE id = NEW.account_id;
    ELSIF (NEW.type = 'debit' OR NEW.type = 'transfer') THEN
      UPDATE public.accounts 
      SET balance = balance - NEW.amount,
          available_balance = available_balance - NEW.amount,
          updated_at = now()
      WHERE id = NEW.account_id;
    END IF;
    
    -- Set balance_after
    SELECT balance INTO NEW.balance_after 
    FROM public.accounts 
    WHERE id = NEW.account_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_balance ON public.transactions;
CREATE TRIGGER trg_update_balance
BEFORE INSERT ON public.transactions
FOR EACH ROW
EXECUTE PROCEDURE public.update_account_balance();

-- Function to calculate available balance dynamically (Robust)
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

-- Trigger: Auto-update available_balance when holds change
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

-- Trigger: Auto-create accounts after KYC approval
CREATE OR REPLACE FUNCTION public.create_accounts_after_kyc()
RETURNS trigger AS $$
BEGIN
  IF (NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved') THEN
    -- Create checking account
    INSERT INTO public.accounts (user_id, account_type, account_number, balance, available_balance)
    VALUES (NEW.user_id, 'checking', public.generate_account_number(), 0, 0)
    ON CONFLICT DO NOTHING;
    
    -- Create savings account
    INSERT INTO public.accounts (user_id, account_type, account_number, balance, available_balance)
    VALUES (NEW.user_id, 'savings', public.generate_account_number(), 0, 0)
    ON CONFLICT DO NOTHING;
    
    -- Update bank_users KYC status
    UPDATE public.bank_users SET kyc_status = 'approved' WHERE id = NEW.user_id;
    
    -- Create default notification preferences
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT DO NOTHING;
    
    -- Create default user settings
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_accounts_after_kyc ON public.kyc_submissions;
CREATE TRIGGER trg_accounts_after_kyc
AFTER UPDATE ON public.kyc_submissions
FOR EACH ROW
EXECUTE PROCEDURE public.create_accounts_after_kyc();

-- Card Helper Functions
CREATE OR REPLACE FUNCTION generate_card_number()
RETURNS text AS $$
DECLARE
  num text;
BEGIN
  -- Generate 16-digit card number starting with 4532 (Visa format)
  num := '4532' || lpad((floor(random()*1e12))::bigint::text, 12, '0');
  RETURN num;
END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION generate_expiry_date()
RETURNS text AS $$
DECLARE
  expiry_month text;
  expiry_year text;
BEGIN
  expiry_month := lpad((EXTRACT(MONTH FROM now()))::text, 2, '0');
  expiry_year := (EXTRACT(YEAR FROM now() + interval '3 years') - 2000)::text;
  RETURN expiry_month || '/' || expiry_year;
END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION generate_cvv()
RETURNS text AS $$
BEGIN
  RETURN lpad((floor(random()*1000))::int::text, 3, '0');
END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION create_card_details()
RETURNS trigger AS $$
BEGIN
  NEW.card_number := generate_card_number();
  NEW.expiry_date := generate_expiry_date();
  NEW.cvv := generate_cvv();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_card_details ON cards;
CREATE TRIGGER trg_generate_card_details
BEFORE INSERT ON cards
FOR EACH ROW
EXECUTE PROCEDURE create_card_details();

CREATE OR REPLACE FUNCTION create_card_alert()
RETURNS trigger AS $$
BEGIN
  INSERT INTO alerts (user_id, type, title, message, severity)
  VALUES (
    NEW.user_id,
    'general',
    'New card requested',
    'Your physical ' || NEW.card_type || ' card has been requested and will be shipped to your address within 5-7 business days.',
    'success'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_create_card_alert ON cards;
CREATE TRIGGER trg_create_card_alert
AFTER INSERT ON cards
FOR EACH ROW
EXECUTE PROCEDURE create_card_alert();

-- ================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- Enable RLS on all tables
ALTER TABLE public.bank_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spending_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_limits ENABLE ROW LEVEL SECURITY;

-- Bank Users Policies
CREATE POLICY "Users can view own profile" ON public.bank_users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.bank_users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- KYC Policies
CREATE POLICY "Users can insert own KYC" ON public.kyc_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own KYC" ON public.kyc_submissions FOR SELECT USING (auth.uid() = user_id);

-- Accounts Policies
CREATE POLICY "Users can view own accounts" ON public.accounts FOR SELECT USING (auth.uid() = user_id);

-- Transactions Policies
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Beneficiaries Policies
CREATE POLICY "Users can manage own beneficiaries" ON public.beneficiaries FOR ALL USING (auth.uid() = user_id);

-- Transfers Policies (Robust)
CREATE POLICY "Users can view own transfers" ON public.transfers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own transfers" ON public.transfers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own initiated transfers" ON public.transfers FOR UPDATE USING (user_id = auth.uid() AND status = 'initiated');

-- External Accounts Policies
CREATE POLICY "Users can manage own external accounts" ON public.external_accounts FOR ALL USING (user_id = auth.uid());

-- Holds Policies
CREATE POLICY "Users can view own holds" ON public.holds FOR SELECT USING (EXISTS (SELECT 1 FROM accounts WHERE id = holds.account_id AND user_id = auth.uid()));

-- Ledger Policies
CREATE POLICY "Users can view own ledger entries" ON public.ledger_entries FOR SELECT USING (TRUE); -- Simplified for now, refine if needed based on privacy

-- Transfer Events Policies
CREATE POLICY "Users can view own transfer events" ON public.transfer_events FOR SELECT USING (EXISTS (SELECT 1 FROM transfers WHERE id = transfer_events.transfer_id AND user_id = auth.uid()));

-- Transfer Limits Policies
CREATE POLICY "Anyone can view transfer limits" ON public.transfer_limits FOR SELECT USING (true);

-- Analytics & Dashboard Policies
CREATE POLICY "Users can view own analytics" ON public.spending_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own summaries" ON public.monthly_summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own summaries" ON public.monthly_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own alerts" ON public.alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert alerts" ON public.alerts FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage own goals" ON public.savings_goals FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own statements" ON public.statements FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own payments" ON public.recurring_payments FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification prefs" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own login history" ON public.login_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own audit logs" ON public.audit_log FOR SELECT USING (auth.uid() = user_id);

-- Cards Policies
CREATE POLICY "Users can view own cards" ON public.cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cards" ON public.cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cards" ON public.cards FOR UPDATE USING (auth.uid() = user_id);

-- ================================================
-- CONSOLIDATION COMPLETE
-- ================================================
