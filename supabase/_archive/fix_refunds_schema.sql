-- ================================================
-- REFUNDS SYSTEM FIX (Schema & Permissions)
-- ================================================

-- 1. Create Tables (if they don't exist)
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

CREATE TABLE IF NOT EXISTS public.refund_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_id uuid NOT NULL REFERENCES public.refunds(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.refunds_idempotency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  idempotency_key text UNIQUE NOT NULL,
  refund_id uuid NOT NULL REFERENCES public.refunds(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds_idempotency ENABLE ROW LEVEL SECURITY;

-- 3. Create POLICIES

-- >>> REFUNDS <<<

-- Admin Full Access
CREATE POLICY "Admins can manage all refunds"
ON public.refunds
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
  OR
  auth.uid() = '68b77735-6ff7-47c4-a30d-f007cf67371b'
);

-- User View Own
CREATE POLICY "Users can view own refunds"
ON public.refunds
FOR SELECT
USING (user_id = auth.uid());

-- >>> REFUND EVENTS <<<

-- Admin Full Access
CREATE POLICY "Admins can manage all refund events"
ON public.refund_events
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
  OR
  auth.uid() = '68b77735-6ff7-47c4-a30d-f007cf67371b'
);

-- User View Own Events
CREATE POLICY "Users can view own refund events"
ON public.refund_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.refunds
    WHERE id = refund_events.refund_id
    AND user_id = auth.uid()
  )
);

-- >>> REFUNDS IDEMPOTENCY <<<

-- Admin Full Access
CREATE POLICY "Admins can manage all idempotency"
ON public.refunds_idempotency
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
  OR
  auth.uid() = '68b77735-6ff7-47c4-a30d-f007cf67371b'
);

-- User View Own
CREATE POLICY "Users can view own idempotency"
ON public.refunds_idempotency
FOR SELECT
USING (user_id = auth.uid());

-- User Insert Own (needed for client-side idempotency checks if any)
CREATE POLICY "Users can insert own idempotency"
ON public.refunds_idempotency
FOR INSERT
WITH CHECK (user_id = auth.uid());
