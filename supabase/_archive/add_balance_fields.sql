-- ================================================
-- ADD AVAILABLE BALANCE & PENDING BALANCE FIELDS
-- ================================================
-- Run this in Supabase SQL Editor

-- Add available_balance and pending_balance to accounts table
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS available_balance numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS pending_balance numeric NOT NULL DEFAULT 0;

-- Add comment explaining the fields
COMMENT ON COLUMN public.accounts.balance IS 'Total account balance';
COMMENT ON COLUMN public.accounts.available_balance IS 'Balance available for withdrawal (balance - pending)';
COMMENT ON COLUMN public.accounts.pending_balance IS 'Amount held in pending transactions';

-- Update existing accounts to set available_balance = balance
UPDATE public.accounts 
SET available_balance = balance,
    pending_balance = 0
WHERE available_balance = 0;

-- Create function to update available balance when transactions are pending
CREATE OR REPLACE FUNCTION public.calculate_available_balance(account_id uuid)
RETURNS numeric AS $$
DECLARE
  total_balance numeric;
  pending_total numeric;
BEGIN
  -- Get total balance
  SELECT balance INTO total_balance
  FROM public.accounts
  WHERE id = account_id;
  
  -- Get pending transactions total
  SELECT COALESCE(SUM(ABS(amount)), 0) INTO pending_total
  FROM public.transactions
  WHERE account_id = account_id
    AND status = 'pending'
    AND type IN ('debit', 'transfer');
  
  RETURN total_balance - pending_total;
END;
$$ LANGUAGE plpgsql;

-- Verification query - check all accounts have the new fields
SELECT 
  id,
  account_type,
  account_number,
  balance,
  available_balance,
  pending_balance
FROM public.accounts
LIMIT 5;

