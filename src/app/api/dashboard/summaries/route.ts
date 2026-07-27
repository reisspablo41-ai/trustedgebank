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

    // Fetch monthly summaries
    const { data: summaries, error } = await supabase
      .from('monthly_summaries')
      .select('month, total_income, total_expenses')
      .eq('user_id', user.id)
      .order('month', { ascending: true })
      .limit(4);

    if (error) {
      console.error('Error fetching summaries:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const trend = (summaries || []).map(
      (s: { month: string; total_income: number; total_expenses: number }) => {
        const monthDate = new Date(s.month);
        return {
          month: monthNames[monthDate.getMonth()],
          income: Math.round(s.total_income),
          expenses: Math.round(s.total_expenses),
        };
      }
    );

    console.log('API: Fetched monthly summaries:', trend);

    return NextResponse.json({ summaries: trend });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
