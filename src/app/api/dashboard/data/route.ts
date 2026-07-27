import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
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

    console.log('API: Fetching all dashboard data for user:', user.id);
    console.log('API: User email:', user.email);

    // Fetch all data in parallel
    const [accountsRes, transactionsRes, alertsRes, goalsRes, statementsRes] =
      await Promise.all([
        // Accounts
        supabase
          .from('accounts')
          .select('id, account_number, account_type, balance')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true }),

        // Recent Transactions
        supabase
          .from('transactions')
          .select(
            'id, amount, direction, transaction_type, description, created_at, status, reference, balance_after, metadata'
          )
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),

        // Alerts
        supabase
          .from('alerts')
          .select('id, type, title, message, severity')
          .eq('user_id', user.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(3),

        // Savings Goals
        supabase
          .from('savings_goals')
          .select('id, goal_name, target_amount, current_amount, target_date')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),

        // Statements
        supabase
          .from('statements')
          .select('id, statement_month, file_url, file_type')
          .eq('user_id', user.id)
          .order('statement_month', { ascending: false })
          .limit(2),
      ]);

    // Log any errors
    if (accountsRes.error) console.log('Accounts error:', accountsRes.error);
    if (transactionsRes.error)
      console.log('Transactions error:', transactionsRes.error);
    if (alertsRes.error) console.log('Alerts error:', alertsRes.error);
    if (goalsRes.error && goalsRes.error.code !== 'PGRST116')
      console.log('Goals error:', goalsRes.error);
    if (statementsRes.error)
      console.log('Statements error:', statementsRes.error);

    const accounts = accountsRes.data ?? [];
    const transactions = transactionsRes.data ?? [];
    const alerts = alertsRes.data ?? [];
    const goal = goalsRes.data ?? null;
    const statements = statementsRes.data ?? [];

    console.log('API: Dashboard data fetched:', {
      accountsCount: accounts.length,
      transactionsCount: transactions.length,
      alertsCount: alerts.length,
      hasGoal: !!goal,
      statementsCount: statements.length,
    });

    console.log('API: Accounts data:', JSON.stringify(accounts, null, 2));
    console.log(
      'API: Transactions data:',
      JSON.stringify(transactions, null, 2)
    );
    console.log('API: Alerts data:', JSON.stringify(alerts, null, 2));
    console.log('API: Goal data:', JSON.stringify(goal, null, 2));
    console.log('API: Statements data:', JSON.stringify(statements, null, 2));

    return NextResponse.json({
      accounts,
      transactions,
      alerts,
      goal,
      statements,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
