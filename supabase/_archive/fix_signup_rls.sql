-- Fix for "new row violates row-level security policy for table bank_users"
-- This allows authenticated users to insert their own row into the bank_users table during signup.

-- Drop existing policy if it exists (to avoid conflicts if retrying)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.bank_users;

-- Create the INSERT policy
CREATE POLICY "Users can insert own profile" 
ON public.bank_users 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Ensure the UPDATE policy is correct as well
DROP POLICY IF EXISTS "Users can update own profile" ON public.bank_users;
CREATE POLICY "Users can update own profile" 
ON public.bank_users 
FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Ensure SELECT is allowed
DROP POLICY IF EXISTS "Users can view own profile" ON public.bank_users;
CREATE POLICY "Users can view own profile" 
ON public.bank_users 
FOR SELECT 
USING (auth.uid() = id);
