-- ================================================
-- CREATE DASHBOARD TABLES IN SUPABASE
-- ================================================
-- Run this script in Supabase SQL Editor
-- These tables are needed for dashboard features

-- ================================================
-- 1. MONTHLY SUMMARIES TABLE
-- ================================================
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

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_monthly_summaries_user_month 
ON public.monthly_summaries(user_id, month DESC);

-- Enable RLS
ALTER TABLE public.monthly_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own summaries
CREATE POLICY "Users can view own monthly summaries" 
ON public.monthly_summaries
FOR SELECT 
USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own summaries
CREATE POLICY "Users can insert own monthly summaries" 
ON public.monthly_summaries
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- ================================================
-- 2. ALERTS TABLE
-- ================================================
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

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_alerts_user_created 
ON public.alerts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_user_unread 
ON public.alerts(user_id, is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own alerts
CREATE POLICY "Users can view own alerts" 
ON public.alerts
FOR SELECT 
USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own alerts (mark as read)
CREATE POLICY "Users can update own alerts" 
ON public.alerts
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policy: System can insert alerts for users
CREATE POLICY "System can insert alerts" 
ON public.alerts
FOR INSERT 
WITH CHECK (true);

-- ================================================
-- 3. SAVINGS GOALS TABLE
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

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_status 
ON public.savings_goals(user_id, status);

-- Enable RLS
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own goals
CREATE POLICY "Users can view own savings goals" 
ON public.savings_goals
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own savings goals" 
ON public.savings_goals
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings goals" 
ON public.savings_goals
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings goals" 
ON public.savings_goals
FOR DELETE 
USING (auth.uid() = user_id);

-- ================================================
-- 4. STATEMENTS TABLE
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

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_statements_user_month 
ON public.statements(user_id, statement_month DESC);

-- Enable RLS
ALTER TABLE public.statements ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own statements
CREATE POLICY "Users can view own statements" 
ON public.statements
FOR SELECT 
USING (auth.uid() = user_id);

-- ================================================
-- 5. RECURRING PAYMENTS TABLE (FOR BILL REMINDERS)
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

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_recurring_payments_user_next_date 
ON public.recurring_payments(user_id, next_payment_date);

-- Enable RLS
ALTER TABLE public.recurring_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own recurring payments
CREATE POLICY "Users can view own recurring payments" 
ON public.recurring_payments
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring payments" 
ON public.recurring_payments
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring payments" 
ON public.recurring_payments
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring payments" 
ON public.recurring_payments
FOR DELETE 
USING (auth.uid() = user_id);

-- ================================================
-- 6. BENEFICIARIES TABLE (FOR TRANSFERS)
-- ================================================
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

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_beneficiaries_user_favorite 
ON public.beneficiaries(user_id, is_favorite DESC);

-- Enable RLS
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own beneficiaries
CREATE POLICY "Users can view own beneficiaries" 
ON public.beneficiaries
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own beneficiaries" 
ON public.beneficiaries
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own beneficiaries" 
ON public.beneficiaries
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own beneficiaries" 
ON public.beneficiaries
FOR DELETE 
USING (auth.uid() = user_id);

-- ================================================
-- VERIFICATION QUERY
-- ================================================
-- Check if all tables were created successfully
SELECT 
  schemaname,
  tablename,
  hasindexes,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN (
    'monthly_summaries', 
    'alerts', 
    'savings_goals', 
    'statements', 
    'recurring_payments', 
    'beneficiaries'
  )
ORDER BY tablename;

-- ================================================
-- DONE!
-- ================================================
-- All dashboard tables have been created with:
-- ✅ Primary keys
-- ✅ Foreign keys
-- ✅ Indexes for performance
-- ✅ RLS (Row Level Security) policies
-- ✅ Check constraints for data validation

