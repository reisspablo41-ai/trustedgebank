-- Fix: Add missing RLS INSERT policy for transactions table
-- Run this in Supabase SQL Editor

-- Check current policies on transactions table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'transactions' 
ORDER BY policyname;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS transactions_select_owner ON public.transactions;
DROP POLICY IF EXISTS transactions_insert_owner ON public.transactions;
DROP POLICY IF EXISTS transactions_update_owner ON public.transactions;

-- Create the missing RLS policies
-- Users can select their own transactions
CREATE POLICY transactions_select_owner ON public.transactions
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own transactions (THIS WAS MISSING!)
CREATE POLICY transactions_insert_owner ON public.transactions
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own transactions
CREATE POLICY transactions_update_owner ON public.transactions
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'transactions' 
ORDER BY policyname;

-- Test that the policy works (optional - replace with your actual user_id and account_id)
-- This should work if you're authenticated
-- INSERT INTO public.transactions (
--   user_id, 
--   account_id, 
--   transaction_type, 
--   direction,
--   amount, 
--   currency,
--   status,
--   description,
--   reference,
--   balance_after,
--   metadata
-- ) VALUES (
--   auth.uid(),
--   (SELECT id FROM public.accounts WHERE user_id = auth.uid() LIMIT 1),
--   'bill_payment',
--   'debit',
--   10.00,
--   'USD',
--   'completed',
--   'Test bill payment',
--   'TEST-' || extract(epoch from now())::bigint,
--   100.00,
--   '{"test": true}'::jsonb
-- );

-- Done! Transactions should now work properly
