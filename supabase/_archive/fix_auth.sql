-- ================================================
-- AUTH & PERMISSIONS FIX
-- ================================================

-- 1. Create user_roles table (Missing from original schema)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'admin', 'super_admin', 'support')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS for user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policies for user_roles
-- Users can read their own roles
CREATE POLICY "Users can read own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Only admins/system can insert/update/delete roles (handled by service role or triggers usually)
-- But for now we might leave it open to service role only by not adding other policies.

-- 2. Fix bank_users policies
-- Add INSERT policy so users can create their own profile during signup
CREATE POLICY "Users can insert own profile"
ON public.bank_users FOR INSERT
WITH CHECK (auth.uid() = id);

-- 3. Automatic User Creation (Robustness)
-- Trigger to automatically create bank_users record when a new user signs up
-- This ensures bank_users always exists even if client-side insert fails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create bank_users record
  INSERT INTO public.bank_users (id, email, full_name, kyc_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Assign default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists to avoid duplication
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.handle_new_user();

-- 4. Fix other potential RLS blocks
-- Ensure external_accounts has insert policy
CREATE POLICY "Users can insert own external accounts"
ON public.external_accounts FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Ensure cards has insert policy
-- (Already likely covered but good to double check)
-- CREATE POLICY "Users can insert own cards" ON public.cards FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ================================================
-- FIX COMPLETE
-- ================================================
