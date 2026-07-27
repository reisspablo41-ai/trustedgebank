-- =====================================================
-- UPDATE USER_ROLES TO USE AUTH.USERS INSTEAD OF BANK_USERS
-- This allows admin roles for ANY authenticated user
-- =====================================================

-- Step 1: Drop the foreign key constraint to bank_users
ALTER TABLE user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Step 2: Add foreign key to auth.users instead
ALTER TABLE user_roles
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Step 3: Verify the change
SELECT 
  constraint_name,
  table_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'user_roles';

-- Step 4: Add admin role for a specific auth user
-- Replace with the actual user ID from auth.users
INSERT INTO user_roles (user_id, role)
VALUES ('PASTE-AUTH-USER-ID-HERE', 'admin')
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin', updated_at = NOW();

-- =====================================================
-- FIND AUTH USER IDS
-- =====================================================

-- Get all auth users and their IDs
SELECT 
  id as auth_user_id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- =====================================================
-- CHECK CURRENT USER_ROLES
-- =====================================================

-- See what's currently in user_roles
SELECT 
  ur.user_id,
  ur.role,
  au.email,
  au.created_at
FROM user_roles ur
JOIN auth.users au ON au.id = ur.user_id
ORDER BY ur.created_at DESC;

-- =====================================================
-- ADD ADMIN BY EMAIL (EASIER)
-- =====================================================

-- Add admin role using email lookup
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@example.com'
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin', updated_at = NOW();


