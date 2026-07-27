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

    // Get current month start
    const currentMonthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    ).toISOString();

    // Fetch spending by category (current month)
    const { data: categoryData, error } = await supabase
      .from('transactions')
      .select('transaction_type, amount, metadata')
      .eq('user_id', user.id)
      .eq('direction', 'debit')
      .gte('created_at', currentMonthStart);

    if (error) {
      console.error('Error fetching spending:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate by category
    const categoryMap: { [key: string]: number } = {};
    const categoryColors: { [key: string]: string } = {
      'Bill Payments': '#FF8042', // Orange for bill payments
      'Money Transfers': '#0088FE', // Blue for transfers
      Fees: '#FF6B9D', // Pink for fees
      Withdrawals: '#8884d8', // Purple for withdrawals
      'Other Expenses': '#999999', // Gray for other
    };

    (categoryData || []).forEach(
      (txn: { transaction_type: string; amount: number; metadata: any }) => {
        let cat = 'Other Expenses'; // Default category

        // Categorize based on transaction type
        switch (txn.transaction_type) {
          case 'payment':
            // Bill payments - try to get specific category from metadata
            if (txn.metadata?.payee_category) {
              cat = txn.metadata.payee_category;
            } else {
              cat = 'Bill Payments';
            }
            break;
          case 'transfer':
            cat = 'Money Transfers';
            break;
          case 'fee':
            cat = 'Fees';
            break;
          case 'withdrawal':
            cat = 'Withdrawals';
            break;
          default:
            cat = 'Other Expenses';
        }

        categoryMap[cat] = (categoryMap[cat] || 0) + Math.abs(txn.amount);
      }
    );

    const spending = Object.entries(categoryMap).map(([key, value]) => ({
      name: key,
      value: Math.round(value),
      color: categoryColors[key] || '#999999',
    }));

    console.log('API: Fetched spending data:', spending);

    return NextResponse.json({ spending });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
