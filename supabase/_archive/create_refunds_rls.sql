-- =====================================================
-- REFUNDS SYSTEM - RLS POLICIES
-- =====================================================

-- Enable RLS on all refund tables
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- REFUNDS TABLE POLICIES
-- =====================================================

-- Users can view their own refunds
CREATE POLICY "Users can view own refunds"
ON refunds FOR SELECT
USING (user_id = auth.uid());

-- Users can update their own refunds (for withdrawal)
CREATE POLICY "Users can update own refunds"
ON refunds FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins can view all refunds
-- CREATE POLICY "Admins can view all refunds"
-- ON refunds FOR SELECT
-- USING (
--   EXISTS (
--     SELECT 1 FROM user_roles
--     WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
--   )
-- );

-- Admins can create refunds for any user
-- CREATE POLICY "Admins can create refunds"
-- ON refunds FOR INSERT
-- WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM user_roles
--     WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
--   )
-- );

-- Admins can update any refund
-- CREATE POLICY "Admins can update refunds"
-- ON refunds FOR UPDATE
-- USING (
--   EXISTS (
--     SELECT 1 FROM user_roles
--     WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
--   )
-- );

-- =====================================================
-- REFUNDS_IDEMPOTENCY TABLE POLICIES
-- =====================================================

-- Users can view their own idempotency records
CREATE POLICY "Users can view own idempotency"
ON refunds_idempotency FOR SELECT
USING (user_id = auth.uid());

-- Users can insert idempotency records
CREATE POLICY "Users can insert idempotency"
ON refunds_idempotency FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Admins can view all idempotency records
-- CREATE POLICY "Admins can view all idempotency"
-- ON refunds_idempotency FOR SELECT
-- USING (
--   EXISTS (
--     SELECT 1 FROM user_roles
--     WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
--   )
-- );

-- =====================================================
-- REFUND_EVENTS TABLE POLICIES
-- =====================================================

-- Users can view events for their own refunds
CREATE POLICY "Users can view own refund events"
ON refund_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM refunds
    WHERE id = refund_events.refund_id
      AND user_id = auth.uid()
  )
);

-- System can insert events (no user check for system events)
CREATE POLICY "Allow insert refund events"
ON refund_events FOR INSERT
WITH CHECK (true);

-- Admins can view all events
-- CREATE POLICY "Admins can view all events"
-- ON refund_events FOR SELECT
-- USING (
--   EXISTS (
--     SELECT 1 FROM user_roles
--     WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
--   )
-- );

-- =====================================================
-- TEMPORARY: Allow all authenticated users (for testing without user_roles)
-- Remove these in production once user_roles is set up
-- =====================================================

-- Temporary: Allow authenticated users to do everything (TESTING ONLY)
CREATE POLICY "Temp - Authenticated users full access to refunds"
ON refunds FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Temp - Authenticated users full access to idempotency"
ON refunds_idempotency FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Temp - Authenticated users full access to events"
ON refund_events FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Users can view own refunds" ON refunds IS 'Users can only see their own refund requests';
COMMENT ON POLICY "Users can update own refunds" ON refunds IS 'Users can withdraw their own approved refunds';
COMMENT ON POLICY "Temp - Authenticated users full access to refunds" ON refunds IS 'TEMPORARY - Remove in production. Allows all auth users full access for testing.';

-- =====================================================
-- PRODUCTION DEPLOYMENT STEPS
-- =====================================================
-- 1. Run create_user_roles_table.sql
-- 2. Assign admin roles to users
-- 3. Drop temporary policies:
--    DROP POLICY "Temp - Authenticated users full access to refunds" ON refunds;
--    DROP POLICY "Temp - Authenticated users full access to idempotency" ON refunds_idempotency;
--    DROP POLICY "Temp - Authenticated users full access to events" ON refund_events;
-- 4. Uncomment admin policies above

