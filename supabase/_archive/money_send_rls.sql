-- ============================================================================
-- TRUST EDGE BANK MONEY-SEND SYSTEM - RLS POLICIES
-- ============================================================================
-- Row-Level Security policies for transfers, holds, ledger, and related tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTERNAL ACCOUNTS RLS
-- ----------------------------------------------------------------------------
ALTER TABLE external_accounts ENABLE ROW LEVEL SECURITY;

-- Users can view their own external accounts
CREATE POLICY external_accounts_select_own
  ON external_accounts FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own external accounts
CREATE POLICY external_accounts_insert_own
  ON external_accounts FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own external accounts
CREATE POLICY external_accounts_update_own
  ON external_accounts FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own external accounts
CREATE POLICY external_accounts_delete_own
  ON external_accounts FOR DELETE
  USING (user_id = auth.uid());

-- Admins can view all external accounts
CREATE POLICY external_accounts_admin_all
  ON external_accounts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM bank_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- 2. TRANSFERS RLS
-- ----------------------------------------------------------------------------
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- Users can view their own transfers
CREATE POLICY transfers_select_own
  ON transfers FOR SELECT
  USING (user_id = auth.uid());

-- Users can create transfers from accounts they own
CREATE POLICY transfers_insert_own
  ON transfers FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM accounts
      WHERE id = from_account_id AND user_id = auth.uid()
    )
  );

-- Users can cancel their own transfers (only if not yet processed)
CREATE POLICY transfers_update_cancel_own
  ON transfers FOR UPDATE
  USING (
    user_id = auth.uid() AND
    status = 'initiated'
  )
  WITH CHECK (
    user_id = auth.uid() AND
    status = 'cancelled'
  );

-- Admins can view all transfers
CREATE POLICY transfers_admin_select
  ON transfers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bank_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update transfers (for settlement, reversals, etc.)
CREATE POLICY transfers_admin_update
  ON transfers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bank_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- 3. HOLDS RLS
-- ----------------------------------------------------------------------------
ALTER TABLE holds ENABLE ROW LEVEL SECURITY;

-- Users can view holds on their own accounts
CREATE POLICY holds_select_own
  ON holds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM accounts
      WHERE accounts.id = holds.account_id AND accounts.user_id = auth.uid()
    )
  );

-- Only system/admin can create holds
CREATE POLICY holds_admin_insert
  ON holds FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bank_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only system/admin can update holds
CREATE POLICY holds_admin_update
  ON holds FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bank_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can view all holds
CREATE POLICY holds_admin_select
  ON holds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bank_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- 4. LEDGER ENTRIES RLS
-- ----------------------------------------------------------------------------
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

-- Users can view ledger entries for their own accounts
CREATE POLICY ledger_entries_select_own
  ON ledger_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM accounts
      WHERE accounts.id = ledger_entries.account_id AND accounts.user_id = auth.uid()
    )
  );

-- Only system/admin can insert ledger entries
CREATE POLICY ledger_entries_admin_insert
  ON ledger_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bank_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can view all ledger entries
CREATE POLICY ledger_entries_admin_select
  ON ledger_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bank_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- 5. TRANSFER EVENTS RLS
-- ----------------------------------------------------------------------------
ALTER TABLE transfer_events ENABLE ROW LEVEL SECURITY;

-- Users can view events for their own transfers
CREATE POLICY transfer_events_select_own
  ON transfer_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM transfers
      WHERE transfers.id = transfer_events.transfer_id AND transfers.user_id = auth.uid()
    )
  );

-- Admins can view all transfer events
CREATE POLICY transfer_events_admin_select
  ON transfer_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bank_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System can insert transfer events
CREATE POLICY transfer_events_system_insert
  ON transfer_events FOR INSERT
  WITH CHECK (true); -- Allow system to log events

-- ----------------------------------------------------------------------------
-- 6. TRANSFER LIMITS RLS
-- ----------------------------------------------------------------------------
ALTER TABLE transfer_limits ENABLE ROW LEVEL SECURITY;

-- Users can view limits that apply to them
CREATE POLICY transfer_limits_select_applicable
  ON transfer_limits FOR SELECT
  USING (
    user_id = auth.uid() OR user_id IS NULL
  );

-- Only admins can modify limits
CREATE POLICY transfer_limits_admin_all
  ON transfer_limits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM bank_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- 7. UPDATE ACCOUNTS RLS FOR AVAILABLE BALANCE
-- ----------------------------------------------------------------------------
-- Users can view their available balance
-- (already covered by existing accounts RLS, but ensure available_balance is included)

-- Add policy comment for clarity
COMMENT ON COLUMN accounts.available_balance IS 'Balance available for immediate use (balance - active holds)';
COMMENT ON COLUMN accounts.pending_balance IS 'Sum of pending incoming transactions';

-- ============================================================================
-- END OF RLS POLICIES
-- ============================================================================

