# Admin Access Setup Guide

## 🔐 Overview

Admin access to the `/admin` routes is now **strictly controlled** by the `user_roles` table. Only users with `role = 'admin'` in the `user_roles` table can access the admin dashboard.

---

## 🚫 Access Control

### Who Can Access Admin Routes?

- ✅ Users who are authenticated AND have a record in `user_roles` with `role = 'admin'`
- ❌ Regular users (no entry in `user_roles` or `role = 'user'`)
- ❌ Unauthenticated users (redirected to login)

### What Happens When Access is Denied?

1. **Not logged in**: Redirected to `/auth/login`
2. **Logged in but not admin**: Redirected to `/dashboard`
3. **Admin role found**: Access granted to admin panel

---

## 📋 Setup Steps

### Step 1: Ensure `user_roles` Table Exists

Run the table creation script in your Supabase SQL editor:

```bash
# File: supabase/create_user_roles_table.sql
```

Or manually create:

```sql
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES bank_users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own role"
ON user_roles FOR SELECT
USING (user_id = auth.uid());
```

### Step 2: Grant Admin Access to a User

#### Method A: By Email Address

```sql
-- Replace 'admin@trustedgebank.com' with your admin email
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM bank_users
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@trustedgebank.com'
)
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

#### Method B: By User ID

```sql
-- First, find your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then grant admin role (replace 'your-user-uuid-here')
INSERT INTO user_roles (user_id, role)
VALUES ('your-user-uuid-here', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

#### Method C: Using the Helper Script

```bash
# Edit supabase/setup_admin_user.sql
# Update the email address on line 7
# Run the script in Supabase SQL editor
```

### Step 3: Verify Admin Access

```sql
-- View all admin users
SELECT ur.user_id, au.email, ur.role, ur.created_at
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE ur.role = 'admin';
```

---

## 🧪 Testing

### Test 1: Regular User Access

1. Log in as a regular user (not in `user_roles` or `role = 'user'`)
2. Navigate to `/admin`
3. **Expected**: Redirected to `/dashboard`

### Test 2: Admin User Access

1. Add user to `user_roles` with `role = 'admin'`
2. Log in as that user
3. Navigate to `/admin`
4. **Expected**: Admin dashboard loads successfully

### Test 3: Unauthenticated Access

1. Log out
2. Navigate to `/admin`
3. **Expected**: Redirected to `/auth/login`

---

## 🔧 Managing Admin Users

### Grant Admin Access

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

### Revoke Admin Access

```sql
-- Option 1: Delete the role
DELETE FROM user_roles WHERE user_id = 'user-uuid-here';

-- Option 2: Downgrade to regular user
UPDATE user_roles
SET role = 'user'
WHERE user_id = 'user-uuid-here';
```

### List All Admins

```sql
SELECT
  ur.user_id,
  au.email,
  bu.full_name,
  ur.role,
  ur.created_at
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
LEFT JOIN bank_users bu ON ur.user_id = bu.id
WHERE ur.role IN ('admin', 'super_admin')
ORDER BY ur.created_at DESC;
```

---

## 🚨 Security Notes

1. **No Testing Bypass**: The admin layout no longer allows access when the table doesn't exist or role is missing. This is production-ready.

2. **Row-Level Security**: The `user_roles` table has RLS enabled. Users can only view their own role.

3. **Cascade Deletion**: When a user is deleted from `bank_users`, their role is automatically removed.

4. **Unique Constraint**: Each user can only have one role entry.

5. **Role Values**: Only 'user', 'admin', and 'super_admin' are valid roles.

---

## 📊 Access Control Flow

```
User navigates to /admin
         ↓
Check authentication (Supabase Auth)
         ↓
   Not logged in? → Redirect to /auth/login
         ↓
Query user_roles table
         ↓
   No record found? → Redirect to /dashboard
   role != 'admin'? → Redirect to /dashboard
         ↓
   role == 'admin' → ✅ Grant access to admin panel
```

---

## 🛠️ Troubleshooting

### Issue: "Admin access denied" but I added the role

**Solutions:**

1. Verify the user_id matches:

   ```sql
   SELECT id FROM auth.users WHERE email = 'your-email@example.com';
   SELECT * FROM user_roles WHERE user_id = 'that-id';
   ```

2. Check if role value is correct:

   ```sql
   SELECT * FROM user_roles WHERE user_id = 'your-user-id';
   -- Should show role = 'admin', not 'Admin' or 'ADMIN'
   ```

3. Clear cookies and localStorage, then log in again:
   ```javascript
   // In browser console
   localStorage.clear();
   document.cookie.split(';').forEach((c) => {
     document.cookie = c
       .replace(/^ +/, '')
       .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
   });
   ```

### Issue: Table doesn't exist

**Solution:** Run the table creation script:

```bash
# In Supabase SQL Editor, run:
supabase/create_user_roles_table.sql
```

### Issue: Foreign key constraint error

**Solution:** Make sure the user exists in `bank_users` first:

```sql
-- Check if user exists in bank_users
SELECT * FROM bank_users WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);

-- If not, create the bank_users record first
INSERT INTO bank_users (id, full_name, kyc_status)
SELECT id, email, 'pending'
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (id) DO NOTHING;
```

---

## 📝 Quick Reference Commands

```sql
-- Grant admin to current logged-in user (run in Supabase dashboard as admin)
INSERT INTO user_roles (user_id, role)
VALUES (auth.uid(), 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- View my role
SELECT * FROM user_roles WHERE user_id = auth.uid();

-- Count admins
SELECT COUNT(*) FROM user_roles WHERE role = 'admin';

-- List all users with roles
SELECT
  au.email,
  bu.full_name,
  COALESCE(ur.role, 'no role') as role
FROM auth.users au
LEFT JOIN bank_users bu ON au.id = bu.id
LEFT JOIN user_roles ur ON au.id = ur.user_id
ORDER BY ur.created_at DESC NULLS LAST;
```

---

## ✅ Checklist

Before going to production, ensure:

- [ ] `user_roles` table is created
- [ ] At least one admin user is assigned
- [ ] RLS policies are enabled
- [ ] Admin access is tested and working
- [ ] Regular users are blocked from `/admin` routes
- [ ] No testing/bypass code remains in the layout

---

## 🔗 Related Files

- `src/app/admin/layout.tsx` - Admin layout with access control
- `supabase/create_user_roles_table.sql` - Table creation script
- `supabase/setup_admin_user.sql` - Helper script to grant admin access

---

**Security is now enforced! Only users in `user_roles` with `role = 'admin'` can access the admin panel.** 🔒✅



