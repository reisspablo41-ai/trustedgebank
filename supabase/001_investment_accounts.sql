-- ============================================================================
-- 001_investment_accounts.sql — Investment accounts
-- ============================================================================
--
-- Run AFTER 000_init.sql. Safe to re-run.
--
-- MODEL
--   accounts.account_type gains a third value, 'investment'. That row's
--   `balance` is the account's CASH / buying power — not the portfolio value.
--   Positions live in investment_holdings; portfolio value is
--   cash + SUM(quantity * price). Keeping cash in accounts.balance means the
--   existing transfer, transaction and dashboard code works unchanged: funding
--   an investment account is just an ordinary internal transfer.
--
--   investment_assets is a price catalogue. Prices are static seed data, moved
--   by an admin or a job — there is no market feed wired up.
-- ============================================================================


-- ============================================================================
-- 1. ALLOW THE NEW ACCOUNT TYPE
-- ============================================================================

ALTER TABLE public.accounts
  DROP CONSTRAINT IF EXISTS accounts_account_type_check;

ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_account_type_check
  CHECK (account_type IN ('checking', 'savings', 'investment'));

COMMENT ON COLUMN public.accounts.balance IS
  'Total account balance. For account_type = investment this is settled cash '
  '(buying power) only; position value lives in investment_holdings.';


-- ============================================================================
-- 2. ASSET CATALOGUE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.investment_assets (
  symbol          text PRIMARY KEY,
  name            text NOT NULL,
  asset_class     text NOT NULL
                    CHECK (asset_class IN ('stock', 'etf', 'bond', 'fund', 'crypto')),
  price           numeric(18,4) NOT NULL CHECK (price > 0),
  previous_close  numeric(18,4) NOT NULL CHECK (previous_close > 0),
  currency        text NOT NULL DEFAULT 'USD',
  is_active       boolean NOT NULL DEFAULT true,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investment_assets_class
  ON public.investment_assets(asset_class) WHERE is_active;


-- ============================================================================
-- 3. HOLDINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.investment_holdings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  account_id    uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  symbol        text NOT NULL REFERENCES public.investment_assets(symbol),
  quantity      numeric(18,6) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  -- Weighted average purchase price. Unchanged by sells, so realised P/L and
  -- unrealised P/L both stay derivable.
  average_cost  numeric(18,4) NOT NULL DEFAULT 0 CHECK (average_cost >= 0),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- One row per symbol per account: buys top up the existing position.
CREATE UNIQUE INDEX IF NOT EXISTS idx_investment_holdings_account_symbol
  ON public.investment_holdings(account_id, symbol);

CREATE INDEX IF NOT EXISTS idx_investment_holdings_user_id
  ON public.investment_holdings(user_id);


-- ============================================================================
-- 4. ORDERS
-- ============================================================================
--
-- Immutable fill record. Every buy/sell writes one row here plus one row in
-- public.transactions, so investment activity shows up in the normal
-- transaction feed as well as the portfolio view.

CREATE TABLE IF NOT EXISTS public.investment_orders (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
  account_id   uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  symbol       text NOT NULL REFERENCES public.investment_assets(symbol),
  side         text NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity     numeric(18,6) NOT NULL CHECK (quantity > 0),
  price        numeric(18,4) NOT NULL CHECK (price > 0),
  amount       numeric(18,2) NOT NULL CHECK (amount >= 0),
  status       text NOT NULL DEFAULT 'filled'
                 CHECK (status IN ('filled', 'pending', 'cancelled', 'failed')),
  reference    text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investment_orders_user_id
  ON public.investment_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_investment_orders_account_id
  ON public.investment_orders(account_id);

DROP TRIGGER IF EXISTS trg_investment_holdings_updated_at ON public.investment_holdings;
CREATE TRIGGER trg_investment_holdings_updated_at
  BEFORE UPDATE ON public.investment_holdings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 5. HELPERS
-- ============================================================================

-- Market value of the positions in an investment account (excludes cash).
CREATE OR REPLACE FUNCTION public.investment_positions_value(account_uuid uuid)
RETURNS numeric AS $$
  SELECT COALESCE(SUM(h.quantity * a.price), 0)::numeric(18,2)
  FROM public.investment_holdings h
  JOIN public.investment_assets a ON a.symbol = h.symbol
  WHERE h.account_id = account_uuid
    AND h.quantity > 0;
$$ LANGUAGE sql STABLE;

-- Cash + positions. This is the number the dashboard shows as "portfolio value".
CREATE OR REPLACE FUNCTION public.investment_portfolio_value(account_uuid uuid)
RETURNS numeric AS $$
  SELECT COALESCE((SELECT balance FROM public.accounts WHERE id = account_uuid), 0)
       + public.investment_positions_value(account_uuid);
$$ LANGUAGE sql STABLE;

-- Opens the investment account for a user who was approved before this
-- migration ran. Idempotent — the unique (user_id, account_type) index makes
-- the ON CONFLICT meaningful.
CREATE OR REPLACE FUNCTION public.open_investment_account(target_user uuid)
RETURNS uuid AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO public.accounts (user_id, account_type, account_number)
  VALUES (target_user, 'investment', public.generate_account_number())
  ON CONFLICT (user_id, account_type) DO NOTHING;

  SELECT id INTO new_id
  FROM public.accounts
  WHERE user_id = target_user AND account_type = 'investment';

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- 6. KYC APPROVAL ALSO OPENS AN INVESTMENT ACCOUNT
-- ============================================================================
--
-- Replaces the 000_init.sql version. Identical except for the third INSERT.

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

    INSERT INTO public.accounts (user_id, account_type, account_number)
    VALUES (NEW.user_id, 'investment', public.generate_account_number())
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


-- ============================================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================================
--
-- Same shape as the rest of the schema: the app talks to Supabase with the
-- anon key plus the signed-in user's JWT, so users need real grants and admins
-- are keyed on public.is_admin().

ALTER TABLE public.investment_assets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_orders   ENABLE ROW LEVEL SECURITY;

-- --- investment_assets: public price list, admin-writable -------------------
DROP POLICY IF EXISTS investment_assets_select_all ON public.investment_assets;
DROP POLICY IF EXISTS investment_assets_admin_all  ON public.investment_assets;

CREATE POLICY investment_assets_select_all ON public.investment_assets
  FOR SELECT TO authenticated USING (true);
CREATE POLICY investment_assets_admin_all ON public.investment_assets
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- investment_holdings ----------------------------------------------------
DROP POLICY IF EXISTS investment_holdings_select_own ON public.investment_holdings;
DROP POLICY IF EXISTS investment_holdings_insert_own ON public.investment_holdings;
DROP POLICY IF EXISTS investment_holdings_update_own ON public.investment_holdings;
DROP POLICY IF EXISTS investment_holdings_delete_own ON public.investment_holdings;
DROP POLICY IF EXISTS investment_holdings_admin_all  ON public.investment_holdings;

CREATE POLICY investment_holdings_select_own ON public.investment_holdings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY investment_holdings_insert_own ON public.investment_holdings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY investment_holdings_update_own ON public.investment_holdings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY investment_holdings_delete_own ON public.investment_holdings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY investment_holdings_admin_all ON public.investment_holdings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- investment_orders ------------------------------------------------------
-- No UPDATE/DELETE policy for users: a fill is a record, not a draft.
DROP POLICY IF EXISTS investment_orders_select_own ON public.investment_orders;
DROP POLICY IF EXISTS investment_orders_insert_own ON public.investment_orders;
DROP POLICY IF EXISTS investment_orders_admin_all  ON public.investment_orders;

CREATE POLICY investment_orders_select_own ON public.investment_orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY investment_orders_insert_own ON public.investment_orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY investment_orders_admin_all ON public.investment_orders
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ============================================================================
-- 8. SEED: ASSET CATALOGUE
-- ============================================================================
--
-- Illustrative prices. Update them from wherever you get quotes; the app reads
-- price / previous_close and never writes them.

INSERT INTO public.investment_assets
  (symbol, name, asset_class, price, previous_close)
VALUES
  ('VTI',  'Vanguard Total Stock Market ETF', 'etf',    291.4000, 289.7500),
  ('VOO',  'Vanguard S&P 500 ETF',            'etf',    536.2000, 533.1000),
  ('QQQ',  'Invesco QQQ Trust',               'etf',    486.9000, 490.2000),
  ('BND',  'Vanguard Total Bond Market ETF',  'bond',    73.8000,  73.9500),
  ('SCHD', 'Schwab US Dividend Equity ETF',   'etf',     27.6500,  27.4000),
  ('AAPL', 'Apple Inc.',                      'stock',  228.5000, 225.9000),
  ('MSFT', 'Microsoft Corporation',           'stock',  423.1000, 427.6000),
  ('AMZN', 'Amazon.com, Inc.',                'stock',  198.4000, 196.2000),
  ('GOOGL','Alphabet Inc. Class A',           'stock',  172.9000, 174.3000),
  ('JNJ',  'Johnson & Johnson',               'stock',  158.2000, 157.8000),
  ('TIPS', 'US Treasury Inflation-Protected', 'bond',   107.4000, 107.3000),
  ('TEBMM','Trust Edge Money Market Fund',    'fund',    10.0000,  10.0000)
ON CONFLICT (symbol) DO UPDATE
  SET name        = EXCLUDED.name,
      asset_class = EXCLUDED.asset_class,
      updated_at  = now();


-- ============================================================================
-- 9. BACKFILL: OPEN INVESTMENT ACCOUNTS FOR ALREADY-APPROVED USERS
-- ============================================================================

INSERT INTO public.accounts (user_id, account_type, account_number)
SELECT bu.id, 'investment', public.generate_account_number()
FROM public.bank_users bu
WHERE bu.kyc_status = 'approved'
ON CONFLICT (user_id, account_type) DO NOTHING;
