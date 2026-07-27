-- =====================================================
-- USER ROLES TABLE
-- For admin access control
-- =====================================================

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES bank_users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id) -- One role per user
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own role
CREATE POLICY "Users can view own role"
ON user_roles FOR SELECT
USING (user_id = auth.uid());

-- Only admins can view all roles (requires custom claims in JWT)
-- CREATE POLICY "Admins can view all roles"
-- ON user_roles FOR SELECT
-- USING (
--   EXISTS (
--     SELECT 1 FROM user_roles
--     WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
--   )
-- );

-- Trigger to update timestamp
CREATE OR REPLACE FUNCTION update_user_role_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_role_timestamp
BEFORE UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION update_user_role_timestamp();

-- Insert default admin user (replace with your admin email)
-- INSERT INTO user_roles (user_id, role)
-- SELECT id, 'admin'
-- FROM bank_users
-- WHERE email = 'admin@trustedgebank.com'
-- ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE user_roles IS 'User role assignments for access control';
COMMENT ON COLUMN user_roles.role IS 'user (default), admin (admin panel), super_admin (full access)';

