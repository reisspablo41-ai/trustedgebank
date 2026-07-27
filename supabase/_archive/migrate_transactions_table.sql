-- Migration: Update transactions table to support full transaction tracking
-- Run this in Supabase SQL Editor

-- Step 1: Drop the old transactions table
DROP TABLE IF EXISTS public.transactions CASCADE;

-- Step 2: Create new transactions table with complete schema
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  related_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  transfer_id uuid,
  transaction_type text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('debit', 'credit')),
  amount numeric NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'completed',
  description text,
  reference text,
  balance_after numeric,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

-- Step 3: Create indexes for better performance
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_reference ON public.transactions(reference);

-- Step 4: Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Step 5: Add RLS policies
-- Users can select their own transactions
CREATE POLICY transactions_select_owner ON public.transactions
FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own transactions (for internal operations)
CREATE POLICY transactions_insert_owner ON public.transactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Optional: Allow service role to insert transactions (for API routes)
-- This is automatically allowed by service_role key

-- Step 6: Add helpful comments
COMMENT ON TABLE public.transactions IS 'Complete transaction history for all user financial activities';
COMMENT ON COLUMN public.transactions.transaction_type IS 'Type: internal_transfer, external_transfer, bill_payment, refund, deposit, withdrawal';
COMMENT ON COLUMN public.transactions.direction IS 'Direction: debit (money out) or credit (money in)';
COMMENT ON COLUMN public.transactions.status IS 'Status: completed, pending, processing, failed';
COMMENT ON COLUMN public.transactions.reference IS 'Unique reference number for tracking (e.g., TXN-123456)';
COMMENT ON COLUMN public.transactions.balance_after IS 'Account balance after this transaction';
COMMENT ON COLUMN public.transactions.metadata IS 'Additional data in JSON format (fees, memos, etc.)';

-- Done! Transactions table is now ready for full transaction tracking

