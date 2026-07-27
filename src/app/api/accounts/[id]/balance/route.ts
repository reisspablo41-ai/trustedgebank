import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/accounts/:id/balance
 * Get detailed balance information for an account
 * Returns: balance, available_balance, pending_balance, and breakdown
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: accountId } = await params;

    // Get account
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Get active holds
    const { data: holds } = await supabase
      .from('holds')
      .select('*')
      .eq('account_id', accountId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Calculate breakdown
    const outgoingHolds =
      holds
        ?.filter((h) => h.hold_type === 'outgoing')
        .reduce((sum, h) => sum + parseFloat(h.amount.toString()), 0) || 0;

    const incomingHolds =
      holds
        ?.filter((h) => h.hold_type === 'incoming')
        .reduce((sum, h) => sum + parseFloat(h.amount.toString()), 0) || 0;

    const calculatedAvailable = account.balance - outgoingHolds;
    const calculatedPending = outgoingHolds + incomingHolds;

    // Get recent transactions
    const { data: recentTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      account_id: accountId,
      account_number: account.account_number,
      account_type: account.account_type,
      currency: 'USD',

      // Balances
      balance: parseFloat(account.balance.toString()),
      available_balance: calculatedAvailable,
      pending_balance: calculatedPending,

      // Breakdown
      outgoing_holds: outgoingHolds,
      incoming_holds: incomingHolds,

      // Holds detail
      active_holds: holds || [],

      // Recent activity
      recent_transactions: recentTransactions || [],

      // Metadata
      last_updated: account.updated_at || account.created_at,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
