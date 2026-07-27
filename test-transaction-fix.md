# Transaction Fix Instructions

## Problem

Transactions are not being added to the database when paying bills or sending money because:

1. **Missing RLS INSERT Policy**: The transactions table doesn't have an INSERT policy
2. **Missing Columns**: The code tries to insert fields that don't exist in the current schema
3. **Schema Mismatch**: The application code expects more fields than the basic schema provides

## Solution

Run the SQL file `supabase/complete_transactions_fix.sql` in your Supabase SQL Editor.

## What the fix does:

### 1. Adds Missing Columns

- `category` (text) - for transaction categorization
- `status` (text) - for transaction status tracking
- `reference_number` (text) - for unique transaction references
- `balance_after` (numeric) - for account balance after transaction
- `metadata` (jsonb) - for additional transaction data

### 2. Adds RLS Policies

- `transactions_select_owner` - users can view their own transactions
- `transactions_insert_owner` - users can create their own transactions
- `transactions_update_owner` - users can update their own transactions

### 3. Adds Performance Indexes

- Indexes on category, status, reference_number, and created_at

## After running the fix:

1. **Bill Payments** should create transaction records
2. **Send Money** should create transaction records
3. **Transaction History** should display properly
4. **Dashboard** should show transaction data

## Testing

After applying the fix, try:

1. Pay a bill - check if transaction appears in database
2. Send money - check if transaction appears in database
3. View transaction history - should show the new transactions

## Files Modified

- `supabase/complete_transactions_fix.sql` - Main fix file
- `supabase/fix_transactions_insert_policy.sql` - RLS policy fix
- `supabase/fix_transactions_rls.sql` - Alternative RLS fix

## Database Changes Required

Run the SQL in Supabase SQL Editor to apply the schema changes and RLS policies.
