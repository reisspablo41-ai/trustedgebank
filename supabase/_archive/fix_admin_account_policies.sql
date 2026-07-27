-- ================================================
-- ADMIN ACCOUNT MANAGEMENT FIX
-- ================================================

-- 1. Allow Admins to Insert/Update/Delete Accounts
-- Currently only "Users can view own accounts" exists.
CREATE POLICY "Admins can manage all accounts"
ON public.accounts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
  OR
  auth.uid() = '68b77735-6ff7-47c4-a30d-f007cf67371b'
);

-- 2. Allow Admins to Manage Transactions (for manual deposits/adjustments if needed)
CREATE POLICY "Admins can manage all transactions"
ON public.transactions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
  OR
  auth.uid() = '68b77735-6ff7-47c4-a30d-f007cf67371b'
);

-- 3. Allow Admins to Manage Bank Users (Update KYC status, etc.)
-- We already added SELECT, but need UPDATE for manual stat changes if not covered
CREATE POLICY "Admins can update all profiles"
ON public.bank_users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
  OR
  auth.uid() = '68b77735-6ff7-47c4-a30d-f007cf67371b'
);

-- 4. Allow Admins to View/Manage Transfers
CREATE POLICY "Admins can manage all transfers"
ON public.transfers
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
  OR
  auth.uid() = '68b77735-6ff7-47c4-a30d-f007cf67371b'
);
