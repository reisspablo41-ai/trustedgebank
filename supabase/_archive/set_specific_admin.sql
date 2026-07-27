-- =====================================================
-- SET SPECIFIC USER AS ADMIN
-- User ID: 46d859b7-8231-44f9-9d3f-d5c2d53c5a53
-- =====================================================

-- Verify the user exists
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE id = '46d859b7-8231-44f9-9d3f-d5c2d53c5a53';

-- Add or update admin role for this user
INSERT INTO user_roles (user_id, role)
VALUES ('46d859b7-8231-44f9-9d3f-d5c2d53c5a53', 'admin')
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

-- Verify it worked
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  au.email,
  ur.created_at,
  ur.updated_at
FROM user_roles ur
JOIN auth.users au ON au.id = ur.user_id
WHERE ur.user_id = '46d859b7-8231-44f9-9d3f-d5c2d53c5a53';

-- ✅ Admin user is now configured!
-- The user with ID: 46d859b7-8231-44f9-9d3f-d5c2d53c5a53 can now access /admin


