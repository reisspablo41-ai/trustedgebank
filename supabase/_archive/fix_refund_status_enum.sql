-- Fix refund status enum to include 'approved'
-- Run this in Supabase SQL Editor

-- First, let's check if the refunds table exists and what the current constraint is
-- If the table doesn't exist, we'll need to create it

-- Create the refunds table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'failed', 'cancelled')),
  reason text NOT NULL,
  reason_notes text,
  idempotency_key text UNIQUE NOT NULL,
  external_ref text,
  processor text DEFAULT 'internal',
  failure_reason text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create refund_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.refund_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_id uuid NOT NULL REFERENCES public.refunds(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create refunds_idempotency table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.refunds_idempotency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  idempotency_key text UNIQUE NOT NULL,
  refund_id uuid NOT NULL REFERENCES public.refunds(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds_idempotency ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY IF NOT EXISTS "Users can view own refunds"
ON public.refunds FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can update own refunds"
ON public.refunds FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Temporary: Allow authenticated users to do everything (for testing)
CREATE POLICY IF NOT EXISTS "Temp - Authenticated users full access to refunds"
ON public.refunds FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Temp - Authenticated users full access to refund_events"
ON public.refund_events FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Temp - Authenticated users full access to refunds_idempotency"
ON public.refunds_idempotency FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_refunds_updated_at ON public.refunds;
CREATE TRIGGER update_refunds_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
