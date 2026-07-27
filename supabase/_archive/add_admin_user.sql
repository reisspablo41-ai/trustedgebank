-- =====================================================
-- ADD ADMIN USER
-- Use this to grant admin access to a user
-- =====================================================

-- Step 1: Check if user_roles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_roles'
);

-- Step 2: Make a user an admin (replace with actual email)
-- REPLACE 'user@example.com' WITH YOUR EMAIL
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM bank_users
WHERE email = 'user@example.com'
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin', updated_at = NOW();

-- Step 3: Verify the admin was added
SELECT 
  bu.email,
  bu.full_name,
  ur.role,
  ur.created_at
FROM user_roles ur
JOIN bank_users bu ON bu.id = ur.user_id
WHERE ur.role IN ('admin', 'super_admin');

-- =====================================================
-- MAKE MULTIPLE USERS ADMINS
-- =====================================================

-- Option A: Make specific users admins by email
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM bank_users
WHERE email IN (
  'admin1@example.com',
  'admin2@example.com',
  'admin3@example.com'
)
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin', updated_at = NOW();

-- Option B: Make the first registered user an admin
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM bank_users
ORDER BY created_at ASC
LIMIT 1
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin', updated_at = NOW();

-- =====================================================
-- REMOVE ADMIN ACCESS
-- =====================================================

-- Demote admin back to regular user
UPDATE user_roles
SET role = 'user', updated_at = NOW()
WHERE user_id = (
  SELECT id FROM bank_users WHERE email = 'user@example.com'
);

-- Or delete the role entirely (will default to no special access)
DELETE FROM user_roles
WHERE user_id = (
  SELECT id FROM bank_users WHERE email = 'user@example.com'
);

-- =====================================================
-- LIST ALL USERS AND THEIR ROLES
-- =====================================================

SELECT 
  bu.id,
  bu.email,
  bu.full_name,
  COALESCE(ur.role, 'user') as role,
  bu.created_at as registered_at,
  ur.created_at as role_assigned_at
FROM bank_users bu
LEFT JOIN user_roles ur ON ur.user_id = bu.id
ORDER BY bu.created_at DESC;

