-- ================================================
-- ADMIN PERMISSIONS FIX
-- ================================================

-- 1. Allow Admins to View All KYC Submissions
-- We need to check if the current user is an admin
CREATE POLICY "Admins can view all KYC"
ON public.kyc_submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
  OR
  -- Hardcoded fallback for the specific admin user to guarantee access
  auth.uid() = '68b77735-6ff7-47c4-a30d-f007cf67371b'
);

-- 2. Allow Admins to Update KYC Submissions (Approve/Reject)
CREATE POLICY "Admins can update KYC"
ON public.kyc_submissions
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

-- 3. Ensure Admin Role is Assigned to the Specific User
-- (Just in case the trigger didn't catch it or it was created before the trigger)
INSERT INTO public.user_roles (user_id, role)
VALUES ('68b77735-6ff7-47c4-a30d-f007cf67371b', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Fix Bank Users Visibility for Admin
-- Admins need to see user names/emails to display in the KYC list
CREATE POLICY "Admins can view all profiles"
ON public.bank_users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
  OR
  auth.uid() = '68b77735-6ff7-47c4-a30d-f007cf67371b'
);
