-- Migration: Update kyc_submissions table from old schema to new schema
-- Run this in Supabase SQL Editor

-- Step 1: Drop the old table (WARNING: This deletes all existing KYC submissions)
-- Only do this if you don't have important data
DROP TABLE IF EXISTS public.kyc_submissions CASCADE;

-- Step 2: Create new table with updated schema
CREATE TABLE public.kyc_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  identification_type text NOT NULL CHECK (identification_type IN ('ssn','tin')),
  identification_number text NOT NULL,
  document_urls text[] NOT NULL,
  selfie_url text NOT NULL,
  address text NOT NULL,
  phone_number text NOT NULL,
  proof_of_address_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

-- Step 3: Enable RLS
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Step 4: Add RLS policies
CREATE POLICY IF NOT EXISTS kyc_insert_owner ON public.kyc_submissions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS kyc_select_owner ON public.kyc_submissions
FOR SELECT USING (auth.uid() = user_id);

-- Step 5: Allow admin updates (optional - create admin role first if needed)
CREATE POLICY IF NOT EXISTS kyc_update_admin ON public.kyc_submissions
FOR UPDATE USING (true);  -- Adjust this based on your admin role logic

-- Step 6: Recreate the trigger for auto-account creation
CREATE OR REPLACE FUNCTION public.create_accounts_after_kyc()
RETURNS trigger AS $$
BEGIN
  IF (new.status = 'approved' AND old.status IS DISTINCT FROM 'approved') THEN
    -- create checking
    INSERT INTO public.accounts (user_id, account_type, account_number, balance)
    VALUES (new.user_id, 'checking', public.generate_account_number(), 0)
    ON CONFLICT DO NOTHING;
    -- create savings
    INSERT INTO public.accounts (user_id, account_type, account_number, balance)
    VALUES (new.user_id, 'savings', public.generate_account_number(), 0)
    ON CONFLICT DO NOTHING;
    -- mark bank_users approved
    UPDATE public.bank_users SET kyc_status = 'approved' WHERE id = new.user_id;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_accounts_after_kyc ON public.kyc_submissions;
CREATE TRIGGER trg_accounts_after_kyc
AFTER UPDATE ON public.kyc_submissions
FOR EACH ROW
EXECUTE PROCEDURE public.create_accounts_after_kyc();

-- Done! Table is now updated with the new schema

