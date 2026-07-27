-- Setup Admin User Access
-- This script helps you grant admin access to a user

-- Method 1: Grant admin access to a specific user by email
-- Replace 'admin@trustedgebank.com' with the actual admin email
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@trustedgebank.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Method 2: Grant admin access to a specific user by user ID
-- Replace 'your-user-uuid-here' with the actual user UUID
-- INSERT INTO user_roles (user_id, role)
-- VALUES ('your-user-uuid-here', 'admin')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Method 3: View all users to find the correct user ID
-- Uncomment to see all registered users
-- SELECT id, email, created_at 
-- FROM auth.users 
-- ORDER BY created_at DESC;

-- Method 4: View all current admin users
-- SELECT ur.user_id, au.email, ur.role, ur.created_at
-- FROM user_roles ur
-- JOIN auth.users au ON ur.user_id = au.id
-- WHERE ur.role = 'admin';

-- Method 5: Remove admin access from a user
-- Replace 'user-uuid-here' with the user UUID to remove admin access
-- DELETE FROM user_roles WHERE user_id = 'user-uuid-here';

-- NOTES:
-- 1. Make sure the user_roles table exists (it should be created by create_user_roles_table.sql)
-- 2. The user must be registered in auth.users first
-- 3. Only users with a record in user_roles with role='admin' can access /admin routes
-- 4. Regular users should have role='user' or no entry in user_roles




