-- =====================================================
-- QUICK ADMIN SETUP & DEBUG
-- =====================================================

-- STEP 1: Find your auth user
SELECT 
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- STEP 2: Check current user_roles
SELECT 
  ur.user_id,
  ur.role,
  au.email
FROM user_roles ur
JOIN auth.users au ON au.id = ur.user_id;

-- STEP 3: Add admin role (REPLACE THE EMAIL!)
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'YOUR-EMAIL@example.com'
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin', updated_at = NOW();

-- STEP 4: Verify it worked
SELECT 
  ur.user_id,
  ur.role,
  au.email,
  'Admin access granted' as status
FROM user_roles ur
JOIN auth.users au ON au.id = ur.user_id
WHERE au.email = 'YOUR-EMAIL@example.com';


