-- Fix: Ensure transactions table has proper INSERT permissions
-- Run this in Supabase SQL Editor

-- Check current policies
SELECT * FROM pg_policies WHERE tablename = 'transactions';

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS transactions_insert_owner ON public.transactions;

-- Create a more permissive INSERT policy for authenticated users
-- This allows users to insert transactions for their own records
CREATE POLICY transactions_insert_owner ON public.transactions
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Also ensure the table structure matches what we need
-- Run this to see current columns:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'transactions'
ORDER BY ordinal_position;

-- If any columns are missing, add them:
-- (Uncomment only the ones you need)

-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS related_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transfer_id uuid;
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transaction_type text;
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS direction text CHECK (direction IN ('debit', 'credit'));
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed';
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS reference text;
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS balance_after numeric;
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
-- ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS processed_at timestamptz;

-- Verify the fix by attempting an insert (replace with your user_id and account_id)
-- INSERT INTO public.transactions (
--   user_id, 
--   account_id, 
--   transaction_type, 
--   direction, 
--   amount, 
--   currency, 
--   status, 
--   description, 
--   reference
-- ) VALUES (
--   'your-user-id'::uuid,
--   'your-account-id'::uuid,
--   'test',
--   'debit',
--   10.00,
--   'USD',
--   'completed',
--   'Test transaction',
--   'TEST-123'
-- );

