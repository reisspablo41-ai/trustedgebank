-- =====================================================
-- DEBUG ADMIN ACCESS ISSUE
-- Find out why a user can't access admin panel
-- =====================================================

-- Step 1: List ALL users in your system
SELECT 
  id,
  email,
  full_name,
  created_at,
  kyc_status
FROM bank_users
ORDER BY created_at DESC;

-- Step 2: Check which users have roles assigned
SELECT 
  bu.email,
  bu.full_name,
  ur.role,
  ur.created_at as role_assigned_at
FROM user_roles ur
JOIN bank_users bu ON bu.id = ur.user_id
ORDER BY ur.created_at DESC;

-- Step 3: Find users WITHOUT any role (these can't access admin)
SELECT 
  bu.email,
  bu.full_name,
  bu.id,
  'NO ROLE - Add admin role to grant access' as status
FROM bank_users bu
LEFT JOIN user_roles ur ON ur.user_id = bu.id
WHERE ur.id IS NULL;

-- =====================================================
-- SOLUTION: Add admin role to specific user
-- =====================================================

-- Replace 'user@example.com' with the actual email
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM bank_users
WHERE email = 'user@example.com'
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin', updated_at = NOW();

-- Verify it worked
SELECT 
  bu.email,
  ur.role,
  ur.created_at
FROM user_roles ur
JOIN bank_users bu ON bu.id = ur.user_id
WHERE bu.email = 'user@example.com';

-- =====================================================
-- ALTERNATIVE: Make ALL users admins (testing only!)
-- =====================================================

-- WARNING: This gives admin access to EVERYONE
-- Only use this for testing!
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM bank_users
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin', updated_at = NOW();

-- =====================================================
-- Check RLS Policies (in case that's the issue)
-- =====================================================

-- View current policies on user_roles table
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'user_roles';

-- If no SELECT policy exists, users can't read their role!
-- Fix by running: supabase/create_user_roles_table.sql


