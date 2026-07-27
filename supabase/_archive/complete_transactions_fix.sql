-- Complete fix for transactions table - schema and RLS policies
-- Run this in Supabase SQL Editor to fix all transaction issues

-- Step 1: Check current table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'transactions'
ORDER BY ordinal_position;

-- Step 2: Add missing columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS reference_number text,
ADD COLUMN IF NOT EXISTS balance_after numeric,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Step 3: Add constraints for new columns
ALTER TABLE public.transactions 
ADD CONSTRAINT IF NOT EXISTS transactions_status_check 
CHECK (status IN ('completed', 'pending', 'processing', 'failed', 'cancelled'));

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON public.transactions(reference_number);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- Step 5: Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'transactions' 
ORDER BY policyname;

-- Step 6: Drop and recreate RLS policies
DROP POLICY IF EXISTS transactions_select_owner ON public.transactions;
DROP POLICY IF EXISTS transactions_insert_owner ON public.transactions;
DROP POLICY IF EXISTS transactions_update_owner ON public.transactions;

-- Step 7: Create comprehensive RLS policies
-- Users can select their own transactions
CREATE POLICY transactions_select_owner ON public.transactions
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own transactions
CREATE POLICY transactions_insert_owner ON public.transactions
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own transactions (for status changes, etc.)
CREATE POLICY transactions_update_owner ON public.transactions
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Step 8: Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, qual, with_check
FROM pg_policies 
WHERE tablename = 'transactions' 
ORDER BY policyname;

-- Step 9: Add helpful comments
COMMENT ON TABLE public.transactions IS 'Complete transaction history for all user financial activities';
COMMENT ON COLUMN public.transactions.category IS 'Transaction category: bills_utilities, transfer, deposit, withdrawal, etc.';
COMMENT ON COLUMN public.transactions.status IS 'Transaction status: completed, pending, processing, failed, cancelled';
COMMENT ON COLUMN public.transactions.reference_number IS 'Unique reference number for tracking (e.g., BILL-123456, EXT-789012)';
COMMENT ON COLUMN public.transactions.balance_after IS 'Account balance after this transaction';
COMMENT ON COLUMN public.transactions.metadata IS 'Additional data in JSON format (payee info, transfer details, etc.)';

-- Step 10: Test the fix (optional - uncomment to test)
-- This should work if you're authenticated and have a valid user_id and account_id
-- INSERT INTO public.transactions (
--   user_id, 
--   account_id, 
--   type, 
--   amount, 
--   category,
--   status,
--   description,
--   reference_number,
--   balance_after,
--   metadata
-- ) VALUES (
--   auth.uid(),
--   (SELECT id FROM public.accounts WHERE user_id = auth.uid() LIMIT 1),
--   'debit',
--   10.00,
--   'test',
--   'completed',
--   'Test transaction',
--   'TEST-' || extract(epoch from now())::bigint,
--   100.00,
--   '{"test": true}'::jsonb
-- );

-- Done! Transactions should now work properly
