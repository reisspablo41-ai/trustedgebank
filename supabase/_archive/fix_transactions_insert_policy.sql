-- Fix: Add missing INSERT policy for transactions table
-- Run this in Supabase SQL Editor to fix the issue

-- Check current policies on transactions table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'transactions' 
ORDER BY policyname;

-- Drop existing INSERT policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS transactions_insert_owner ON public.transactions;

-- Create the missing INSERT policy for transactions
-- This allows authenticated users to insert transactions for their own user_id
CREATE POLICY transactions_insert_owner ON public.transactions
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Also add UPDATE policy if needed (for transaction status updates)
DROP POLICY IF EXISTS transactions_update_owner ON public.transactions;
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

-- Test that the policy works (this should not error if user is authenticated)
-- Replace 'your-user-id' with an actual user ID from your bank_users table
-- SELECT auth.uid() as current_user_id;

-- Optional: Add a comment explaining the policy
COMMENT ON POLICY transactions_insert_owner ON public.transactions IS 
'Allows authenticated users to insert transactions for their own user_id';

COMMENT ON POLICY transactions_update_owner ON public.transactions IS 
'Allows authenticated users to update their own transactions';
