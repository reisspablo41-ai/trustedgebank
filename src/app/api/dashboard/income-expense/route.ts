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

    // Fetch all transactions for current month
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('transaction_type, direction, amount, metadata')
      .eq('user_id', user.id)
      .gte('created_at', currentMonthStart);

    if (error) {
      console.error('Error fetching income/expense data:', error);
      // Return empty data instead of 500 so the dashboard still loads
      return NextResponse.json({
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        expenseCategories: [],
        incomeCategories: [],
        _error: error.message,
      });
    }

    // Calculate income and expenses
    let totalIncome = 0;
    let totalExpenses = 0;
    const expenseCategories: { [key: string]: number } = {};
    const incomeCategories: { [key: string]: number } = {};

    (transactions || []).forEach((txn) => {
      const amount = Math.abs(txn.amount);

      if (txn.direction === 'credit') {
        // Income
        totalIncome += amount;

        // Categorize income
        let category = 'Other Income';
        switch (txn.transaction_type) {
          case 'deposit':
            category = 'Deposits';
            break;
          case 'refund':
            category = 'Refunds';
            break;
          case 'interest':
            category = 'Interest';
            break;
          default:
            category = 'Other Income';
        }
        incomeCategories[category] = (incomeCategories[category] || 0) + amount;
      } else if (txn.direction === 'debit') {
        // Expenses
        totalExpenses += amount;

        // Categorize expenses
        let category = 'Other Expenses';
        switch (txn.transaction_type) {
          case 'payment':
            // Bill payments - try to get specific category from metadata
            if (txn.metadata?.payee_category) {
              category = txn.metadata.payee_category;
            } else {
              category = 'Bill Payments';
            }
            break;
          case 'transfer':
            category = 'Money Transfers';
            break;
          case 'fee':
            category = 'Fees';
            break;
          case 'withdrawal':
            category = 'Withdrawals';
            break;
          default:
            category = 'Other Expenses';
        }
        expenseCategories[category] =
          (expenseCategories[category] || 0) + amount;
      }
    });

    // Format expense categories for chart
    const expenseData = Object.entries(expenseCategories).map(
      ([name, value]) => ({
        name,
        value: Math.round(value),
        color: getCategoryColor(name),
      })
    );

    // Format income categories for chart
    const incomeData = Object.entries(incomeCategories).map(
      ([name, value]) => ({
        name,
        value: Math.round(value),
        color: getCategoryColor(name),
      })
    );

    console.log('API: Income/Expense data:', {
      totalIncome: Math.round(totalIncome),
      totalExpenses: Math.round(totalExpenses),
      expenseCategories: expenseData,
      incomeCategories: incomeData,
    });

    return NextResponse.json({
      totalIncome: Math.round(totalIncome),
      totalExpenses: Math.round(totalExpenses),
      netIncome: Math.round(totalIncome - totalExpenses),
      expenseCategories: expenseData,
      incomeCategories: incomeData,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getCategoryColor(category: string): string {
  const colors: { [key: string]: string } = {
    // Expense colors
    'Bill Payments': '#FF8042', // Orange
    'Money Transfers': '#0088FE', // Blue
    Fees: '#FF6B9D', // Pink
    Withdrawals: '#8884d8', // Purple
    'Other Expenses': '#999999', // Gray

    // Income colors
    Deposits: '#00C49F', // Green
    Refunds: '#00C49F', // Green
    Interest: '#AA66CC', // Purple
    'Other Income': '#999999', // Gray

    // Specific bill payment categories
    utilities: '#FF8042',
    rent: '#FF6B9D',
    insurance: '#8884d8',
    subscriptions: '#0088FE',
  };

  return colors[category] || '#999999';
}
