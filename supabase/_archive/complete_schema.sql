-- ================================================
-- TRUST EDGE BANK - COMPLETE DATABASE SCHEMA
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
-- 3. TRANSFERS & PAYMENTS
-- ================================================

-- Beneficiaries (saved recipients)
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

-- Transfers
CREATE TABLE IF NOT EXISTS public.transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  from_account_id uuid NOT NULL REFERENCES public.accounts(id),
  to_account_id uuid REFERENCES public.accounts(id),
  to_external_account text,
  amount numeric NOT NULL CHECK (amount > 0),
  fee numeric DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  transfer_type text NOT NULL CHECK (transfer_type IN ('internal', 'external', 'international')),
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ================================================
-- 4. ANALYTICS & INSIGHTS
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

-- ================================================
-- 5. SAVINGS GOALS
-- ================================================

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

-- ================================================
-- 6. STATEMENTS & DOCUMENTS
-- ================================================

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

-- ================================================
-- 7. BILLS & RECURRING PAYMENTS
-- ================================================

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

-- ================================================
-- 8. NOTIFICATIONS & PREFERENCES
-- ================================================

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

-- ================================================
-- 9. SECURITY & AUDIT
-- ================================================

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
-- 10. HELPER FUNCTIONS
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

-- Update account balance after transaction
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

-- Trigger to update balance on transaction
DROP TRIGGER IF EXISTS trg_update_balance ON public.transactions;
CREATE TRIGGER trg_update_balance
BEFORE INSERT ON public.transactions
FOR EACH ROW
EXECUTE PROCEDURE public.update_account_balance();

-- Auto-create accounts after KYC approval
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

-- ================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
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

-- Bank Users Policies
CREATE POLICY "Users can view own profile" ON public.bank_users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.bank_users
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- KYC Policies
CREATE POLICY "Users can insert own KYC" ON public.kyc_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own KYC" ON public.kyc_submissions
  FOR SELECT USING (auth.uid() = user_id);

-- Accounts Policies
CREATE POLICY "Users can view own accounts" ON public.accounts
  FOR SELECT USING (auth.uid() = user_id);

-- Transactions Policies
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Beneficiaries Policies
CREATE POLICY "Users can manage own beneficiaries" ON public.beneficiaries
  FOR ALL USING (auth.uid() = user_id);

-- Transfers Policies
CREATE POLICY "Users can view own transfers" ON public.transfers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transfers" ON public.transfers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Analytics Policies
CREATE POLICY "Users can view own analytics" ON public.spending_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own summaries" ON public.monthly_summaries
  FOR SELECT USING (auth.uid() = user_id);

-- Alerts Policies
CREATE POLICY "Users can view own alerts" ON public.alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON public.alerts
  FOR UPDATE USING (auth.uid() = user_id);

-- Savings Goals Policies
CREATE POLICY "Users can manage own goals" ON public.savings_goals
  FOR ALL USING (auth.uid() = user_id);

-- Statements Policies
CREATE POLICY "Users can view own statements" ON public.statements
  FOR SELECT USING (auth.uid() = user_id);

-- Recurring Payments Policies
CREATE POLICY "Users can manage own payments" ON public.recurring_payments
  FOR ALL USING (auth.uid() = user_id);

-- Preferences Policies
CREATE POLICY "Users can manage own notification prefs" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);

-- Login History Policies
CREATE POLICY "Users can view own login history" ON public.login_history
  FOR SELECT USING (auth.uid() = user_id);

-- Audit Log Policies  
CREATE POLICY "Users can view own audit logs" ON public.audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- ================================================
-- 12. SAMPLE DATA FOR TESTING (OPTIONAL)
-- ================================================

-- Uncomment to insert sample transaction categories for reference
/*
INSERT INTO public.transactions (user_id, account_id, amount, type, category, description, balance_after)
SELECT 
  user_id,
  id as account_id,
  100.00,
  'credit',
  'income',
  'Sample Payroll Deposit',
  100.00
FROM public.accounts
LIMIT 1;
*/

-- ================================================
-- SCHEMA COMPLETE
-- ================================================

