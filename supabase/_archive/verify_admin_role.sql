-- =====================================================
-- VERIFY ADMIN ROLE IS CORRECTLY SET
-- =====================================================

-- Step 1: Get the authenticated user's email
-- (You need to tell me the email, or run this to see all users)
SELECT 
  id as user_id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- Step 2: Check if this user has an admin role in user_roles
-- Replace 'your-email@example.com' with the actual email
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  au.email,
  ur.created_at,
  ur.updated_at
FROM user_roles ur
JOIN auth.users au ON au.id = ur.user_id
WHERE au.email = 'your-email@example.com';

-- Step 3: Check ALL users with admin roles
SELECT 
  ur.user_id,
  ur.role,
  au.email
FROM user_roles ur
JOIN auth.users au ON au.id = ur.user_id
WHERE ur.role IN ('admin', 'super_admin');

-- Step 4: Check RLS policies on user_roles (might be blocking the read)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'user_roles';

-- Step 5: Test the exact query the app uses
-- Replace 'USER_ID_HERE' with the actual user ID
SELECT role
FROM user_roles
WHERE user_id = 'USER_ID_HERE';

-- =====================================================
-- COMMON ISSUES & FIXES
-- =====================================================

-- Issue 1: Role exists but RLS is blocking it
-- Fix: Ensure SELECT policy exists
CREATE POLICY IF NOT EXISTS "Users can view own role"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Issue 2: Role is 'Admin' instead of 'admin' (case sensitive!)
-- Check:
SELECT user_id, role, length(role), role = 'admin' as matches
FROM user_roles;

-- Fix if needed:
UPDATE user_roles 
SET role = 'admin' 
WHERE LOWER(role) = 'admin' AND role != 'admin';

-- Issue 3: Extra spaces in role value
-- Fix:
UPDATE user_roles 
SET role = TRIM(role);


