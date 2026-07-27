-- ============================================================================
-- TRUST EDGE BANK — COMPLETE DATABASE SCHEMA (single-run install)
-- ============================================================================
--
-- Run this ONCE in the Supabase SQL Editor on a fresh project. It replaces
-- every other .sql file in this directory (see MIGRATION_NOTES section at the
-- bottom for what was merged, and what was deliberately dropped).
--
-- The script is idempotent: re-running it is safe. Tables use IF NOT EXISTS,
-- policies are dropped before being recreated, functions use OR REPLACE, and
-- seed rows are guarded. It does NOT drop or truncate anything, so it will
-- never destroy existing data.
--
-- ORDER MATTERS. Do not reorder sections — foreign keys depend on it.
--
-- After running, grant yourself admin (section 13) or the /admin panel will
-- redirect you to /dashboard.
--
-- ============================================================================


-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()


-- ============================================================================
-- 2. CORE: USERS, ROLES, KYC, ACCOUNTS
-- ============================================================================

-- Mirrors auth.users. Populated automatically by the handle_new_user trigger
-- (section 10) on signup.
CREATE TABLE IF NOT EXISTS public.bank_users (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text NOT NULL,
  full_name     text NOT NULL,
  phone_number  text,
  address       text,
  kyc_status    text NOT NULL DEFAULT 'pending'
                  CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Admin access control. Referenced by is_admin() below and by
-- src/lib/checkAdminRole.ts. FK targets auth.users (not bank_users) so an
-- admin does not need a customer profile row.
CREATE TABLE IF NOT EXISTS public.user_roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)                            -- exactly one role per user
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role    ON public.user_roles(role);

-- Identity verification submissions. Contains SSN/TIN and document URLs —
-- treat as sensitive; RLS in section 11 restricts reads to owner + admins.
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  identification_type   text NOT NULL CHECK (identification_type IN ('ssn', 'tin')),
  identification_number text NOT NULL,
  document_urls         text[] NOT NULL,
  selfie_url            text NOT NULL,
  address               text NOT NULL,
  phone_number          text NOT NULL,
  proof_of_address_url  text NOT NULL,
  status                text NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason      text,
  submitted_at          timestamptz NOT NULL DEFAULT now(),
  reviewed_at           timestamptz,
  reviewed_by           uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_kyc_user_id ON public.kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status  ON public.kyc_submissions(status);

-- Checking / savings accounts. Created automatically on KYC approval.
CREATE TABLE IF NOT EXISTS public.accounts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  account_type      text NOT NULL CHECK (account_type IN ('checking', 'savings')),
  account_number    text NOT NULL UNIQUE,
  balance           numeric(18,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  available_balance numeric(18,2) NOT NULL DEFAULT 0,
  pending_balance   numeric(18,2) NOT NULL DEFAULT 0,
  currency          text NOT NULL DEFAULT 'USD',
  status            text NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'frozen', 'closed')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Upgrade path for databases created before these columns existed.
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS available_balance numeric(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_balance   numeric(18,2) NOT NULL DEFAULT 0;

-- One checking + one savings per user. Also makes the KYC trigger's
-- ON CONFLICT DO NOTHING actually meaningful.
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_user_type
  ON public.accounts(user_id, account_type);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);

COMMENT ON COLUMN public.accounts.balance           IS 'Total account balance';
COMMENT ON COLUMN public.accounts.available_balance IS 'Balance minus active outgoing holds; maintained by trg_update_available_balance_on_hold';
COMMENT ON COLUMN public.accounts.pending_balance   IS 'Amount currently held in pending transfers';


-- ============================================================================
-- 3. TRANSACTIONS
-- ============================================================================
--
-- NOTE ON SHAPE: two incompatible definitions existed in this directory. The
-- application uses transaction_type/direction/currency/reference (see
-- api/dashboard/transactions, api/money-send/transfers, dashboard/bills,
-- dashboard/send-money, admin/refunds). The older type/category/
-- reference_number shape is dead. This is the shape the code actually writes.
--
-- 'posted' is included in the status CHECK because bills, send-money and admin
-- refunds all insert status: 'posted'. Omitting it breaks those three flows.

CREATE TABLE IF NOT EXISTS public.transactions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  account_id         uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  related_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  transfer_id        uuid,
  transaction_type   text NOT NULL,          -- transfer | payment | refund | deposit | withdrawal
  direction          text NOT NULL CHECK (direction IN ('debit', 'credit')),
  amount             numeric(18,2) NOT NULL CHECK (amount >= 0),
  currency           text NOT NULL DEFAULT 'USD',
  status             text NOT NULL DEFAULT 'completed'
                       CHECK (status IN ('posted', 'completed', 'pending',
                                         'processing', 'failed', 'cancelled', 'reversed')),
  category           text,
  description        text,
  reference          text,
  balance_after      numeric(18,2),
  metadata           jsonb DEFAULT '{}'::jsonb,
  created_at         timestamptz NOT NULL DEFAULT now(),
  processed_at       timestamptz
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id    ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type       ON public.transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_status     ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_reference  ON public.transactions(reference);

COMMENT ON COLUMN public.transactions.direction IS 'debit = money out, credit = money in';
COMMENT ON COLUMN public.transactions.reference IS 'Human-facing tracking ref, e.g. TXN-123456 / BILL-123456';


-- ============================================================================
-- 4. MONEY MOVEMENT: external accounts, transfers, holds, ledger
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.external_accounts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  bank_name             text NOT NULL,
  account_holder_name   text NOT NULL,
  account_number_last4  text NOT NULL CHECK (length(account_number_last4) = 4),
  routing_number        text NOT NULL,
  account_type          text NOT NULL CHECK (account_type IN ('checking', 'savings')),
  is_verified           boolean DEFAULT false,
  verification_method   text,
  verified_at           timestamptz,
  nickname              text,
  is_default            boolean DEFAULT false,
  metadata              jsonb DEFAULT '{}',
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_external_accounts_user_id
  ON public.external_accounts(user_id);

CREATE TABLE IF NOT EXISTS public.transfers (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key         text UNIQUE NOT NULL,
  user_id                 uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE RESTRICT,
  from_account_id         uuid NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  to_account_id           uuid REFERENCES public.accounts(id) ON DELETE RESTRICT,
  external_account_id     uuid REFERENCES public.external_accounts(id) ON DELETE RESTRICT,
  transfer_type           text NOT NULL CHECK (transfer_type IN ('internal', 'interbank')),
  amount                  numeric(18,2) NOT NULL CHECK (amount > 0),
  fee                     numeric(18,2) DEFAULT 0 CHECK (fee >= 0),
  currency                text DEFAULT 'USD',
  status                  text NOT NULL DEFAULT 'initiated'
                            CHECK (status IN ('initiated', 'pending', 'processing',
                                              'settled', 'failed', 'cancelled', 'reversed')),
  description             text,
  memo                    text,
  reference               text,
  scheduled_settlement_at timestamptz,
  processed_at            timestamptz,
  settled_at              timestamptz,
  failure_reason          text,
  failure_code            text,
  external_details        jsonb DEFAULT '{}',
  ach_trace_number        text,
  requires_verification   boolean DEFAULT false,
  verified_at             timestamptz,
  verification_method     text,
  device_info             jsonb DEFAULT '{}',
  ip_address              inet,
  metadata                jsonb DEFAULT '{}',
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now(),
  CONSTRAINT valid_transfer_destination CHECK (
    (transfer_type = 'internal'  AND to_account_id IS NOT NULL AND external_account_id IS NULL) OR
    (transfer_type = 'interbank' AND to_account_id IS NULL     AND external_account_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_transfers_user_id      ON public.transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_transfers_from_account ON public.transfers(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status       ON public.transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at   ON public.transfers(created_at DESC);

-- Pending holds against an account; drive available_balance.
CREATE TABLE IF NOT EXISTS public.holds (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  transfer_id  uuid REFERENCES public.transfers(id) ON DELETE SET NULL,
  amount       numeric(18,2) NOT NULL CHECK (amount >= 0),
  hold_type    text NOT NULL CHECK (hold_type IN ('outgoing', 'incoming')),
  status       text NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'released', 'settled')),
  created_at   timestamptz DEFAULT now(),
  released_at  timestamptz,
  expires_at   timestamptz,
  description  text,
  metadata     jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_holds_account_id  ON public.holds(account_id);
CREATE INDEX IF NOT EXISTS idx_holds_transfer_id ON public.holds(transfer_id);

-- Append-only double-entry ledger. Made immutable by triggers in section 10.
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id    uuid REFERENCES public.transfers(id) ON DELETE RESTRICT,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE RESTRICT,
  account_id     uuid NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  entry_type     text NOT NULL CHECK (entry_type IN ('debit', 'credit')),
  amount         numeric(18,2) NOT NULL CHECK (amount >= 0),
  balance_after  numeric(18,2) NOT NULL,
  category       text,
  description    text,
  status         text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'posted', 'reversed')),
  metadata       jsonb DEFAULT '{}',
  created_at     timestamptz DEFAULT now(),
  posted_at      timestamptz
);

CREATE INDEX IF NOT EXISTS idx_ledger_account_id  ON public.ledger_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_transfer_id ON public.ledger_entries(transfer_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at  ON public.ledger_entries(created_at DESC);

CREATE TABLE IF NOT EXISTS public.transfer_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id  uuid NOT NULL REFERENCES public.transfers(id) ON DELETE CASCADE,
  event_type   text NOT NULL,
  from_status  text,
  to_status    text,
  description  text,
  details      jsonb DEFAULT '{}',
  actor_id     uuid,
  actor_type   text DEFAULT 'system',
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transfer_events_transfer_id
  ON public.transfer_events(transfer_id);

CREATE TABLE IF NOT EXISTS public.transfer_limits (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_tier                  text DEFAULT 'standard',
  user_id                       uuid REFERENCES public.bank_users(id) ON DELETE CASCADE,
  per_transaction_min           numeric(18,2) DEFAULT 0.01,
  per_transaction_max           numeric(18,2) DEFAULT 10000.00,
  daily_limit                   numeric(18,2) DEFAULT 5000.00,
  monthly_limit                 numeric(18,2),
  internal_per_transaction_max  numeric(18,2),
  interbank_per_transaction_max numeric(18,2),
  verification_threshold        numeric(18,2) DEFAULT 1000.00,
  savings_monthly_transfer_limit int DEFAULT 6,
  created_at                    timestamptz DEFAULT now(),
  updated_at                    timestamptz DEFAULT now()
);

-- One default tier row, no user override.
CREATE UNIQUE INDEX IF NOT EXISTS idx_transfer_limits_tier_default
  ON public.transfer_limits(account_tier) WHERE user_id IS NULL;

CREATE TABLE IF NOT EXISTS public.beneficiaries (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  name           text NOT NULL,
  account_number text,
  email          text,
  bank_name      text,
  routing_number text,
  is_favorite    boolean DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);


-- ============================================================================
-- 5. CARDS
-- ============================================================================
-- card_number / expiry_date / cvv are filled in by trg_generate_card_details.

CREATE TABLE IF NOT EXISTS public.cards (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  card_number      text UNIQUE,
  card_type        text NOT NULL CHECK (card_type IN ('debit', 'credit', 'prepaid')),
  expiry_date      text,
  cvv              text,
  -- Freeze / card-control state, driven by the dashboard Cards page.
  status           text NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'frozen')),
  online_purchases boolean NOT NULL DEFAULT true,
  atm_withdrawals  boolean NOT NULL DEFAULT true,
  contactless      boolean NOT NULL DEFAULT true,
  daily_limit      numeric(18,2) NOT NULL DEFAULT 5000.00 CHECK (daily_limit >= 0),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Upgrade path for databases created before card controls existed.
ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS status           text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS online_purchases boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS atm_withdrawals  boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS contactless      boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS daily_limit      numeric(18,2) NOT NULL DEFAULT 5000.00,
  ADD COLUMN IF NOT EXISTS updated_at       timestamptz NOT NULL DEFAULT now();

-- Added separately so the upgrade path above also gets the constraint.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cards_status_check'
  ) THEN
    ALTER TABLE public.cards
      ADD CONSTRAINT cards_status_check CHECK (status IN ('active', 'frozen'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);


-- ============================================================================
-- 6. REFUNDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.refunds (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  amount_cents    integer NOT NULL,
  currency        text NOT NULL DEFAULT 'USD',
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'completed', 'failed', 'cancelled')),
  reason          text NOT NULL,
  reason_notes    text,
  idempotency_key text UNIQUE NOT NULL,
  external_ref    text,
  processor       text DEFAULT 'internal',
  failure_reason  text,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON public.refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status  ON public.refunds(status);

CREATE TABLE IF NOT EXISTS public.refund_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_id  uuid NOT NULL REFERENCES public.refunds(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor      text NOT NULL,
  message    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refund_events_refund_id
  ON public.refund_events(refund_id);

CREATE TABLE IF NOT EXISTS public.refunds_idempotency (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  idempotency_key text UNIQUE NOT NULL,
  refund_id       uuid NOT NULL REFERENCES public.refunds(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now()
);


-- ============================================================================
-- 7. DASHBOARD & ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.spending_analytics (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  month             date NOT NULL,
  category          text NOT NULL,
  total_amount      numeric NOT NULL DEFAULT 0,
  transaction_count integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, month, category)
);

CREATE TABLE IF NOT EXISTS public.monthly_summaries (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  month                   date NOT NULL,
  total_income            numeric NOT NULL DEFAULT 0,
  total_expenses          numeric NOT NULL DEFAULT 0,
  net_savings             numeric NOT NULL DEFAULT 0,
  largest_expense         numeric DEFAULT 0,
  largest_expense_category text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, month)
);

CREATE TABLE IF NOT EXISTS public.alerts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  type       text NOT NULL
               CHECK (type IN ('spending', 'saving', 'bill_reminder', 'security', 'general')),
  title      text NOT NULL,
  message    text NOT NULL,
  severity   text NOT NULL DEFAULT 'info'
               CHECK (severity IN ('info', 'warning', 'success', 'error')),
  is_read    boolean DEFAULT false,
  action_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id);

CREATE TABLE IF NOT EXISTS public.savings_goals (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  account_id     uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  goal_name      text NOT NULL,
  target_amount  numeric NOT NULL CHECK (target_amount > 0),
  current_amount numeric NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  target_date    date,
  status         text NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  completed_at   timestamptz
);

CREATE TABLE IF NOT EXISTS public.statements (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  account_id       uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  statement_month  date NOT NULL,
  file_url         text NOT NULL,
  file_type        text NOT NULL DEFAULT 'pdf' CHECK (file_type IN ('pdf', 'csv')),
  opening_balance  numeric NOT NULL,
  closing_balance  numeric NOT NULL,
  total_credits    numeric NOT NULL DEFAULT 0,
  total_debits     numeric NOT NULL DEFAULT 0,
  generated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recurring_payments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  account_id        uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  payee_name        text NOT NULL,
  amount            numeric NOT NULL CHECK (amount > 0),
  frequency         text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  next_payment_date date NOT NULL,
  status            text NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'paused', 'cancelled')),
  auto_pay          boolean DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id            uuid PRIMARY KEY REFERENCES public.bank_users(id) ON DELETE CASCADE,
  transaction_alerts boolean DEFAULT true,
  monthly_statements boolean DEFAULT true,
  marketing_emails   boolean DEFAULT false,
  security_alerts    boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id            uuid PRIMARY KEY REFERENCES public.bank_users(id) ON DELETE CASCADE,
  theme              text DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language           text DEFAULT 'en',
  timezone           text DEFAULT 'America/New_York',
  two_factor_enabled boolean DEFAULT false,
  biometric_enabled  boolean DEFAULT false,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.login_history (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  ip_address   text,
  user_agent   text,
  device_info  jsonb,
  login_method text CHECK (login_method IN ('password', 'biometric', '2fa', 'oauth')),
  status       text NOT NULL CHECK (status IN ('success', 'failed')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES public.bank_users(id) ON DELETE SET NULL,
  action      text NOT NULL,
  entity_type text,
  entity_id   uuid,
  old_values  jsonb,
  new_values  jsonb,
  ip_address  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);


-- ============================================================================
-- 8. ADMIN HELPER
-- ============================================================================
--
-- SECURITY DEFINER so it reads user_roles with RLS bypassed. This is what
-- prevents infinite recursion when an RLS policy on user_roles (or any table)
-- needs to ask "is the caller an admin?".

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = uid
      AND role IN ('admin', 'super_admin')
  );
$$;

COMMENT ON FUNCTION public.is_admin(uuid)
  IS 'True when the given (default: current) user holds admin or super_admin.';


-- ============================================================================
-- 9. HELPER FUNCTIONS
-- ============================================================================

-- Unique 10-digit account number, with collision retry.
CREATE OR REPLACE FUNCTION public.generate_account_number()
RETURNS text AS $$
DECLARE
  num       text;
  is_unique boolean;
BEGIN
  LOOP
    num := lpad((floor(random() * 1e10))::bigint::text, 10, '0');
    SELECT NOT EXISTS (
      SELECT 1 FROM public.accounts WHERE account_number = num
    ) INTO is_unique;
    EXIT WHEN is_unique;
  END LOOP;
  RETURN num;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Dropped first: an older revision declared this with a differently-named
-- parameter, and CREATE OR REPLACE cannot rename parameters.
DROP FUNCTION IF EXISTS public.calculate_available_balance(uuid);

CREATE OR REPLACE FUNCTION public.calculate_available_balance(account_uuid uuid)
RETURNS numeric AS $$
DECLARE
  account_balance numeric;
  total_holds     numeric;
BEGIN
  SELECT balance INTO account_balance
  FROM public.accounts WHERE id = account_uuid;

  SELECT COALESCE(SUM(amount), 0) INTO total_holds
  FROM public.holds
  WHERE account_id = account_uuid
    AND status     = 'active'
    AND hold_type  = 'outgoing';

  RETURN COALESCE(account_balance, 0) - total_holds;
END;
$$ LANGUAGE plpgsql;

-- Regulation-D style counter: transfers out of a savings account in N days.
CREATE OR REPLACE FUNCTION public.count_savings_transfers(
  account_uuid uuid,
  days int DEFAULT 30
)
RETURNS int AS $$
DECLARE
  transfer_count     int;
  account_type_check text;
BEGIN
  SELECT account_type INTO account_type_check
  FROM public.accounts WHERE id = account_uuid;

  IF account_type_check IS DISTINCT FROM 'savings' THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*) INTO transfer_count
  FROM public.transfers
  WHERE from_account_id = account_uuid
    AND status NOT IN ('cancelled', 'failed')
    AND created_at >= now() - (days || ' days')::interval;

  RETURN transfer_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.check_daily_limit(
  user_uuid          uuid,
  amount_to_transfer numeric
)
RETURNS boolean AS $$
DECLARE
  limit_amount numeric;
  today_total  numeric;
BEGIN
  SELECT COALESCE(tl.daily_limit, 5000.00) INTO limit_amount
  FROM public.transfer_limits tl
  WHERE tl.user_id = user_uuid OR tl.account_tier = 'standard'
  ORDER BY tl.user_id DESC NULLS LAST
  LIMIT 1;

  SELECT COALESCE(SUM(amount), 0) INTO today_total
  FROM public.transfers
  WHERE user_id = user_uuid
    AND status IN ('pending', 'processing', 'settled')
    AND created_at >= date_trunc('day', now());

  RETURN (today_total + amount_to_transfer) <= COALESCE(limit_amount, 5000.00);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_user_pending_refunds(user_uuid uuid)
RETURNS numeric AS $$
DECLARE
  total_cents integer;
BEGIN
  SELECT COALESCE(SUM(amount_cents), 0) INTO total_cents
  FROM public.refunds
  WHERE user_id = user_uuid
    AND status IN ('pending', 'approved');

  RETURN total_cents / 100.0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generic updated_at bump, shared by several triggers below.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Card detail generators.
CREATE OR REPLACE FUNCTION public.generate_card_number()
RETURNS text AS $$
BEGIN
  -- Visa-format test PAN. Not a real issuing flow.
  RETURN '4532' || lpad((floor(random() * 1e12))::bigint::text, 12, '0');
END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION public.generate_expiry_date()
RETURNS text AS $$
BEGIN
  RETURN lpad((EXTRACT(MONTH FROM now()))::text, 2, '0') || '/' ||
         (EXTRACT(YEAR FROM now() + interval '3 years') - 2000)::text;
END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION public.generate_cvv()
RETURNS text AS $$
BEGIN
  RETURN lpad((floor(random() * 1000))::int::text, 3, '0');
END;
$$ LANGUAGE plpgsql VOLATILE;


-- ============================================================================
-- 10. TRIGGERS
-- ============================================================================

-- --- New auth user -> bank_users profile -----------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.bank_users (id, email, full_name, kyc_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'New User'),
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --- KYC approval -> open accounts -----------------------------------------
CREATE OR REPLACE FUNCTION public.create_accounts_after_kyc()
RETURNS trigger AS $$
BEGIN
  IF (NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved') THEN

    INSERT INTO public.accounts (user_id, account_type, account_number)
    VALUES (NEW.user_id, 'checking', public.generate_account_number())
    ON CONFLICT (user_id, account_type) DO NOTHING;

    INSERT INTO public.accounts (user_id, account_type, account_number)
    VALUES (NEW.user_id, 'savings', public.generate_account_number())
    ON CONFLICT (user_id, account_type) DO NOTHING;

    UPDATE public.bank_users
    SET kyc_status = 'approved', updated_at = now()
    WHERE id = NEW.user_id;

    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.user_id) ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.user_id) ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_accounts_after_kyc ON public.kyc_submissions;
CREATE TRIGGER trg_accounts_after_kyc
  AFTER UPDATE ON public.kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION public.create_accounts_after_kyc();

-- --- Holds -> available_balance --------------------------------------------
CREATE OR REPLACE FUNCTION public.update_available_balance_on_hold()
RETURNS trigger AS $$
DECLARE
  target_account uuid;
BEGIN
  target_account := CASE WHEN TG_OP = 'DELETE' THEN OLD.account_id ELSE NEW.account_id END;

  UPDATE public.accounts
  SET available_balance = public.calculate_available_balance(target_account)
  WHERE id = target_account;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_available_balance_on_hold ON public.holds;
CREATE TRIGGER trg_update_available_balance_on_hold
  AFTER INSERT OR UPDATE OR DELETE ON public.holds
  FOR EACH ROW EXECUTE FUNCTION public.update_available_balance_on_hold();

-- --- Transfer status changes -> transfer_events ----------------------------
CREATE OR REPLACE FUNCTION public.log_transfer_status_change()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.transfer_events (transfer_id, event_type, to_status, description)
    VALUES (NEW.id, 'status_change', NEW.status, 'Transfer created');
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.transfer_events (transfer_id, event_type, from_status, to_status, description)
    VALUES (NEW.id, 'status_change', OLD.status, NEW.status,
            'Status updated from ' || OLD.status || ' to ' || NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_transfer_status ON public.transfers;
CREATE TRIGGER trg_log_transfer_status
  AFTER INSERT OR UPDATE ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION public.log_transfer_status_change();

-- --- Immutable ledger -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_ledger_modifications()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Ledger entries are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_ledger_update ON public.ledger_entries;
CREATE TRIGGER prevent_ledger_update
  BEFORE UPDATE ON public.ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.prevent_ledger_modifications();

DROP TRIGGER IF EXISTS prevent_ledger_delete ON public.ledger_entries;
CREATE TRIGGER prevent_ledger_delete
  BEFORE DELETE ON public.ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.prevent_ledger_modifications();

-- --- Card details on insert -------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_card_details()
RETURNS trigger AS $$
BEGIN
  NEW.card_number := public.generate_card_number();
  NEW.expiry_date := public.generate_expiry_date();
  NEW.cvv         := public.generate_cvv();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_card_details ON public.cards;
CREATE TRIGGER trg_generate_card_details
  BEFORE INSERT ON public.cards
  FOR EACH ROW EXECUTE FUNCTION public.create_card_details();

CREATE OR REPLACE FUNCTION public.create_card_alert()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.alerts (user_id, type, title, message, severity)
  VALUES (
    NEW.user_id,
    'general',
    'New card requested',
    'Your physical ' || NEW.card_type ||
      ' card has been requested and will be shipped to your address within 5-7 business days.',
    'success'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_create_card_alert ON public.cards;
CREATE TRIGGER trg_create_card_alert
  AFTER INSERT ON public.cards
  FOR EACH ROW EXECUTE FUNCTION public.create_card_alert();

-- --- updated_at maintenance -------------------------------------------------
DROP TRIGGER IF EXISTS trg_refunds_updated_at ON public.refunds;
CREATE TRIGGER trg_refunds_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_transfers_updated_at ON public.transfers;
CREATE TRIGGER trg_transfers_updated_at
  BEFORE UPDATE ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_external_accounts_updated_at ON public.external_accounts;
CREATE TRIGGER trg_external_accounts_updated_at
  BEFORE UPDATE ON public.external_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER trg_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_cards_updated_at ON public.cards;
CREATE TRIGGER trg_cards_updated_at
  BEFORE UPDATE ON public.cards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- DELIBERATELY NOT INSTALLED — see MIGRATION_NOTES (section 14):
--   * update_account_balance()      / trg_update_balance
--   * process_completed_refund()    / auto_process_completed_refund()
-- Both mutate account balances, which the application already does in code.
-- Installing them double-counts every transaction.
-- ---------------------------------------------------------------------------


-- ============================================================================
-- 11. ROW LEVEL SECURITY
-- ============================================================================
--
-- The admin panel runs client-side with the anon key and the signed-in user's
-- session (src/lib/checkAdminRole.ts), so admins need real RLS grants — they
-- are not bypassing RLS via the service role. Every admin grant below is keyed
-- on public.is_admin().
--
-- Policies are dropped before creation because Postgres has no
-- CREATE POLICY IF NOT EXISTS.

ALTER TABLE public.bank_users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_accounts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holds                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_limits          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds_idempotency      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spending_analytics       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_summaries        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statements               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log                ENABLE ROW LEVEL SECURITY;

-- --- bank_users -------------------------------------------------------------
DROP POLICY IF EXISTS bank_users_select_own   ON public.bank_users;
DROP POLICY IF EXISTS bank_users_insert_own   ON public.bank_users;
DROP POLICY IF EXISTS bank_users_update_own   ON public.bank_users;
DROP POLICY IF EXISTS bank_users_admin_all    ON public.bank_users;

CREATE POLICY bank_users_select_own ON public.bank_users
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY bank_users_insert_own ON public.bank_users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY bank_users_update_own ON public.bank_users
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY bank_users_admin_all ON public.bank_users
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- user_roles -------------------------------------------------------------
-- Read-only to the owner. Role changes are an admin/service-role operation on
-- purpose: letting a user write this table is privilege escalation.
DROP POLICY IF EXISTS user_roles_select_own ON public.user_roles;
DROP POLICY IF EXISTS user_roles_admin_all  ON public.user_roles;

CREATE POLICY user_roles_select_own ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY user_roles_admin_all ON public.user_roles
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- kyc_submissions --------------------------------------------------------
DROP POLICY IF EXISTS kyc_insert_own ON public.kyc_submissions;
DROP POLICY IF EXISTS kyc_select_own ON public.kyc_submissions;
DROP POLICY IF EXISTS kyc_admin_all  ON public.kyc_submissions;

CREATE POLICY kyc_insert_own ON public.kyc_submissions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY kyc_select_own ON public.kyc_submissions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY kyc_admin_all ON public.kyc_submissions
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- accounts ---------------------------------------------------------------
DROP POLICY IF EXISTS accounts_select_own ON public.accounts;
DROP POLICY IF EXISTS accounts_update_own ON public.accounts;
DROP POLICY IF EXISTS accounts_admin_all  ON public.accounts;

CREATE POLICY accounts_select_own ON public.accounts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- Needed because bills / send-money adjust balance client-side.
CREATE POLICY accounts_update_own ON public.accounts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY accounts_admin_all ON public.accounts
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- transactions -----------------------------------------------------------
DROP POLICY IF EXISTS transactions_select_own ON public.transactions;
DROP POLICY IF EXISTS transactions_insert_own ON public.transactions;
DROP POLICY IF EXISTS transactions_update_own ON public.transactions;
DROP POLICY IF EXISTS transactions_admin_all  ON public.transactions;

CREATE POLICY transactions_select_own ON public.transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY transactions_insert_own ON public.transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY transactions_update_own ON public.transactions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY transactions_admin_all ON public.transactions
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- external_accounts ------------------------------------------------------
DROP POLICY IF EXISTS external_accounts_own       ON public.external_accounts;
DROP POLICY IF EXISTS external_accounts_admin_all ON public.external_accounts;

CREATE POLICY external_accounts_own ON public.external_accounts
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY external_accounts_admin_all ON public.external_accounts
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- transfers --------------------------------------------------------------
DROP POLICY IF EXISTS transfers_select_own  ON public.transfers;
DROP POLICY IF EXISTS transfers_insert_own  ON public.transfers;
DROP POLICY IF EXISTS transfers_update_own  ON public.transfers;
DROP POLICY IF EXISTS transfers_admin_all   ON public.transfers;

CREATE POLICY transfers_select_own ON public.transfers
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY transfers_insert_own ON public.transfers
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
-- Only while still cancellable; settled transfers are not user-editable.
CREATE POLICY transfers_update_own ON public.transfers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status IN ('initiated', 'pending'))
  WITH CHECK (user_id = auth.uid());
CREATE POLICY transfers_admin_all ON public.transfers
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- holds ------------------------------------------------------------------
DROP POLICY IF EXISTS holds_select_own ON public.holds;
DROP POLICY IF EXISTS holds_insert_own ON public.holds;
DROP POLICY IF EXISTS holds_admin_all  ON public.holds;

CREATE POLICY holds_select_own ON public.holds
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.accounts a
            WHERE a.id = holds.account_id AND a.user_id = auth.uid())
  );
CREATE POLICY holds_insert_own ON public.holds
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.accounts a
            WHERE a.id = holds.account_id AND a.user_id = auth.uid())
  );
CREATE POLICY holds_admin_all ON public.holds
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- ledger_entries ---------------------------------------------------------
-- Scoped to the owning account. (The previous schema used USING (TRUE), which
-- exposed every customer's ledger to every signed-in user.)
DROP POLICY IF EXISTS ledger_select_own ON public.ledger_entries;
DROP POLICY IF EXISTS ledger_insert_own ON public.ledger_entries;
DROP POLICY IF EXISTS ledger_admin_all  ON public.ledger_entries;

CREATE POLICY ledger_select_own ON public.ledger_entries
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.accounts a
            WHERE a.id = ledger_entries.account_id AND a.user_id = auth.uid())
  );
CREATE POLICY ledger_insert_own ON public.ledger_entries
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.accounts a
            WHERE a.id = ledger_entries.account_id AND a.user_id = auth.uid())
  );
CREATE POLICY ledger_admin_all ON public.ledger_entries
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- transfer_events --------------------------------------------------------
DROP POLICY IF EXISTS transfer_events_select_own ON public.transfer_events;
DROP POLICY IF EXISTS transfer_events_admin_all  ON public.transfer_events;

CREATE POLICY transfer_events_select_own ON public.transfer_events
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.transfers t
            WHERE t.id = transfer_events.transfer_id AND t.user_id = auth.uid())
  );
CREATE POLICY transfer_events_admin_all ON public.transfer_events
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- transfer_limits --------------------------------------------------------
DROP POLICY IF EXISTS transfer_limits_read  ON public.transfer_limits;
DROP POLICY IF EXISTS transfer_limits_admin ON public.transfer_limits;

CREATE POLICY transfer_limits_read ON public.transfer_limits
  FOR SELECT TO authenticated USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY transfer_limits_admin ON public.transfer_limits
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- beneficiaries ----------------------------------------------------------
DROP POLICY IF EXISTS beneficiaries_own ON public.beneficiaries;
CREATE POLICY beneficiaries_own ON public.beneficiaries
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- cards ------------------------------------------------------------------
DROP POLICY IF EXISTS cards_select_own ON public.cards;
DROP POLICY IF EXISTS cards_insert_own ON public.cards;
DROP POLICY IF EXISTS cards_update_own ON public.cards;
DROP POLICY IF EXISTS cards_admin_all  ON public.cards;

CREATE POLICY cards_select_own ON public.cards
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY cards_insert_own ON public.cards
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY cards_update_own ON public.cards
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY cards_admin_all ON public.cards
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- refunds ----------------------------------------------------------------
DROP POLICY IF EXISTS refunds_select_own ON public.refunds;
DROP POLICY IF EXISTS refunds_insert_own ON public.refunds;
DROP POLICY IF EXISTS refunds_update_own ON public.refunds;
DROP POLICY IF EXISTS refunds_admin_all  ON public.refunds;

CREATE POLICY refunds_select_own ON public.refunds
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY refunds_insert_own ON public.refunds
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY refunds_update_own ON public.refunds
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY refunds_admin_all ON public.refunds
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- refund_events ----------------------------------------------------------
DROP POLICY IF EXISTS refund_events_select_own ON public.refund_events;
DROP POLICY IF EXISTS refund_events_insert_own ON public.refund_events;
DROP POLICY IF EXISTS refund_events_admin_all  ON public.refund_events;

CREATE POLICY refund_events_select_own ON public.refund_events
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.refunds r
            WHERE r.id = refund_events.refund_id AND r.user_id = auth.uid())
  );
CREATE POLICY refund_events_insert_own ON public.refund_events
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.refunds r
            WHERE r.id = refund_events.refund_id AND r.user_id = auth.uid())
  );
CREATE POLICY refund_events_admin_all ON public.refund_events
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- refunds_idempotency ----------------------------------------------------
DROP POLICY IF EXISTS refunds_idem_select_own ON public.refunds_idempotency;
DROP POLICY IF EXISTS refunds_idem_insert_own ON public.refunds_idempotency;
DROP POLICY IF EXISTS refunds_idem_admin_all  ON public.refunds_idempotency;

CREATE POLICY refunds_idem_select_own ON public.refunds_idempotency
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY refunds_idem_insert_own ON public.refunds_idempotency
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY refunds_idem_admin_all ON public.refunds_idempotency
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- dashboard & analytics --------------------------------------------------
DROP POLICY IF EXISTS spending_analytics_own ON public.spending_analytics;
CREATE POLICY spending_analytics_own ON public.spending_analytics
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS monthly_summaries_own ON public.monthly_summaries;
CREATE POLICY monthly_summaries_own ON public.monthly_summaries
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS alerts_select_own ON public.alerts;
DROP POLICY IF EXISTS alerts_update_own ON public.alerts;
DROP POLICY IF EXISTS alerts_insert_own ON public.alerts;
DROP POLICY IF EXISTS alerts_admin_all  ON public.alerts;

CREATE POLICY alerts_select_own ON public.alerts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY alerts_update_own ON public.alerts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY alerts_insert_own ON public.alerts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY alerts_admin_all ON public.alerts
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS savings_goals_own ON public.savings_goals;
CREATE POLICY savings_goals_own ON public.savings_goals
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS statements_select_own ON public.statements;
DROP POLICY IF EXISTS statements_admin_all  ON public.statements;
CREATE POLICY statements_select_own ON public.statements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY statements_admin_all ON public.statements
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS recurring_payments_own ON public.recurring_payments;
CREATE POLICY recurring_payments_own ON public.recurring_payments
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS notification_preferences_own ON public.notification_preferences;
CREATE POLICY notification_preferences_own ON public.notification_preferences
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_settings_own ON public.user_settings;
CREATE POLICY user_settings_own ON public.user_settings
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS login_history_select_own ON public.login_history;
DROP POLICY IF EXISTS login_history_insert_own ON public.login_history;
CREATE POLICY login_history_select_own ON public.login_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY login_history_insert_own ON public.login_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS audit_log_select_own ON public.audit_log;
DROP POLICY IF EXISTS audit_log_admin_all  ON public.audit_log;
CREATE POLICY audit_log_select_own ON public.audit_log
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY audit_log_admin_all ON public.audit_log
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ============================================================================
-- 12. STORAGE BUCKET + RLS
-- ============================================================================
--
-- Bucket name must match NEXT_PUBLIC_STORAGE_BUCKET in .env.local.
-- Upload paths are '{auth_user_id}/filename' (see src/app/kyc/page.tsx), which
-- is what the foldername checks below rely on.
--
-- ⚠️  THIS BUCKET IS PUBLIC. It holds KYC material — ID scans, selfies, proof
--     of address. Public means anyone with the URL can read those files
--     without authenticating. It is set public only because the app calls
--     getPublicUrl() to render documents; flipping it to private without also
--     changing that code will break the KYC screens.
--     To harden: set public = false below, then change uploadFile() in
--     src/app/kyc/page.tsx to createSignedUrl(path, <ttl>) and drop the
--     storage_public_read policy.

INSERT INTO storage.buckets (id, name, public)
VALUES ('northbridge-storage', 'northbridge-storage', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS storage_insert_own  ON storage.objects;
DROP POLICY IF EXISTS storage_select_own  ON storage.objects;
DROP POLICY IF EXISTS storage_update_own  ON storage.objects;
DROP POLICY IF EXISTS storage_delete_own  ON storage.objects;
DROP POLICY IF EXISTS storage_admin_read  ON storage.objects;
DROP POLICY IF EXISTS storage_public_read ON storage.objects;
-- Legacy names from the previous storage.sql:
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files"       ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files"     ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files"     ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access"                   ON storage.objects;

-- Users write only inside their own {user_id}/ prefix.
CREATE POLICY storage_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'northbridge-storage'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY storage_select_own ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'northbridge-storage'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY storage_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'northbridge-storage'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'northbridge-storage'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY storage_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'northbridge-storage'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins review KYC documents belonging to other users.
CREATE POLICY storage_admin_read ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'northbridge-storage' AND public.is_admin());

-- Required by getPublicUrl(). Delete this together with public = false above
-- when you move to signed URLs.
CREATE POLICY storage_public_read ON storage.objects
  FOR SELECT
  USING (bucket_id = 'northbridge-storage');


-- ============================================================================
-- 13. SEED DATA
-- ============================================================================

INSERT INTO public.transfer_limits
  (account_tier, per_transaction_max, daily_limit, verification_threshold)
SELECT 'standard', 10000.00, 5000.00, 1000.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.transfer_limits
  WHERE account_tier = 'standard' AND user_id IS NULL
);

-- ---------------------------------------------------------------------------
-- GRANT YOURSELF ADMIN — required to reach /admin.
-- Uncomment, set your email, and run.
-- ---------------------------------------------------------------------------
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin' FROM auth.users WHERE email = 'you@example.com'
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin', updated_at = now();


-- ============================================================================
-- 14. MIGRATION NOTES
-- ============================================================================
--
-- MERGED FROM: schema.sql, complete_schema.sql, create_dashboard_tables.sql,
-- create_cards_table.sql, create_transfers_system.sql, money_send_schema.sql,
-- money_send_rls.sql, create_user_roles_table.sql, update_user_roles_to_auth.sql,
-- create_refunds_rls.sql, fix_refunds_schema.sql, fix_refund_status_enum.sql,
-- fix_refunds_admin_access.sql, fix_refunds_balance_system.sql,
-- migrate_kyc_table.sql, migrate_transactions_table.sql,
-- complete_transactions_fix.sql, add_balance_fields.sql, fix_auth.sql,
-- fix_signup_rls.sql, setup_auth_trigger.sql, fix_kyc_account_creation.sql,
-- ensure_kyc_approval_flow.sql, fix_kyc_admin_update.sql, fix_admin_policies.sql,
-- fix_admin_account_policies.sql, fix_transactions_rls.sql,
-- fix_transactions_rls_only.sql, fix_transactions_insert_policy.sql,
-- fix_refunds_schema.sql, storage.sql.
--
-- CONFLICTS RESOLVED
--
-- 1. transactions had two incompatible shapes. Kept transaction_type/direction/
--    currency/reference (what the app writes); dropped the type/category/
--    reference_number shape. 'posted' added to the status CHECK — the old
--    constraint in complete_transactions_fix.sql omitted it and would have
--    rejected every insert from bills, send-money and admin refunds.
--
-- 2. calculate_available_balance existed twice with different parameter names,
--    which CREATE OR REPLACE cannot reconcile. Kept the holds-based version;
--    the other one compared account_id to itself (always true) and summed
--    every pending row in the table.
--
-- 3. update_account_balance()/trg_update_balance NOT installed. It read
--    NEW.type (gone in the current shape) and adjusted balances that the
--    application already adjusts in code — installing it double-counts.
--
-- 4. process_completed_refund()/auto_process_completed_refund() NOT installed.
--    Same double-count, and it inserted into transactions using columns that
--    do not exist (transaction_type/direction were fine, but it also wrote
--    'posted' into a constrained status and referenced a `reference` column
--    alongside a mismatched signature).
--
-- 5. Blanket "any authenticated user" policies REMOVED — they granted every
--    signed-in customer full read/write over all refunds, all KYC submissions
--    (SSN, ID scans) and all refund events. Replaced with is_admin() grants.
--
-- 6. Hardcoded admin UUID 68b77735-6ff7-47c4-a30d-f007cf67371b REMOVED from
--    four policies. Grant admin via section 13 instead.
--
-- 7. ledger_entries SELECT was USING (TRUE) — every user could read every
--    ledger. Now scoped to the owning account.
--
-- 8. CREATE POLICY IF NOT EXISTS and ALTER TABLE ... ADD CONSTRAINT IF NOT
--    EXISTS are not valid Postgres; those statements never applied. Rewritten
--    as DROP POLICY IF EXISTS + CREATE POLICY.
--
-- 9. user_roles FK now targets auth.users (per update_user_roles_to_auth.sql),
--    and ON CONFLICT (user_id, role) corrected to ON CONFLICT (user_id) —
--    the composite target matched no unique constraint and always errored.
--
-- 10. Added a unique index on accounts(user_id, account_type) so the KYC
--     trigger's ON CONFLICT DO NOTHING actually prevents duplicate accounts
--     on re-approval.
--
-- KNOWN ISSUE NOT FIXED HERE (needs a code change, not a schema change):
--   src/app/admin/page.tsx:150 selects a `type` column from transactions.
--   That column does not exist in the current shape; the query returns an
--   error and the "recent activity" list on the admin dashboard stays empty.
--   Fix by selecting transaction_type instead.
--
-- ============================================================================
