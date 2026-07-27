-- Fix: Ensure admin can access refunds table
-- Run this in Supabase SQL Editor

-- Check current policies on refunds table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'refunds' 
ORDER BY policyname;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own refunds" ON refunds;
DROP POLICY IF EXISTS "Users can update own refunds" ON refunds;
DROP POLICY IF EXISTS "Temp - Authenticated users full access to refunds" ON refunds;
DROP POLICY IF EXISTS "Admins can view all refunds" ON refunds;
DROP POLICY IF EXISTS "Admins can create refunds" ON refunds;
DROP POLICY IF EXISTS "Admins can update refunds" ON refunds;

-- Create comprehensive RLS policies for refunds table

-- 1. Users can view their own refunds
CREATE POLICY "refunds_select_owner" ON refunds
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Users can update their own refunds
CREATE POLICY "refunds_update_owner" ON refunds
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Users can insert their own refunds
CREATE POLICY "refunds_insert_owner" ON refunds
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Admin policies - Allow authenticated users to do everything (for admin panel)
CREATE POLICY "refunds_admin_full_access" ON refunds
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Check if refund_events table exists and has policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'refund_events' 
ORDER BY policyname;

-- If refund_events table exists, ensure it has proper policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'refund_events' AND table_schema = 'public') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view own refund events" ON refund_events;
        DROP POLICY IF EXISTS "Allow insert refund events" ON refund_events;
        DROP POLICY IF EXISTS "Admins can view all events" ON refund_events;
        DROP POLICY IF EXISTS "Temp - Authenticated users full access to events" ON refund_events;
        
        -- Create new policies
        CREATE POLICY "refund_events_select_owner" ON refund_events
        FOR SELECT 
        USING (
            EXISTS (
                SELECT 1 FROM refunds
                WHERE id = refund_events.refund_id
                  AND user_id = auth.uid()
            )
        );
        
        CREATE POLICY "refund_events_insert_all" ON refund_events
        FOR INSERT 
        WITH CHECK (true);
        
        CREATE POLICY "refund_events_admin_full_access" ON refund_events
        FOR ALL
        USING (auth.uid() IS NOT NULL)
        WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
END
$$;

-- Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'refunds' 
ORDER BY policyname;

-- Test query to verify access (replace with actual user_id if needed)
-- SELECT COUNT(*) FROM refunds;

-- Add helpful comments
COMMENT ON POLICY "refunds_select_owner" ON refunds IS 'Users can view their own refunds';
COMMENT ON POLICY "refunds_update_owner" ON refunds IS 'Users can update their own refunds';
COMMENT ON POLICY "refunds_insert_owner" ON refunds IS 'Users can create their own refunds';
COMMENT ON POLICY "refunds_admin_full_access" ON refunds IS 'Admin full access - allows authenticated users to manage all refunds';

-- Done! Admin should now be able to access refunds table
