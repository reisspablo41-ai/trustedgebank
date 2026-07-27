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

    // Fetch statements
    const { data: statements, error } = await supabase
      .from('statements')
      .select('id, statement_month, file_url, file_type')
      .eq('user_id', user.id)
      .order('statement_month', { ascending: false })
      .limit(2);

    if (error) {
      console.error('Error fetching statements:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`API: Fetched ${statements?.length || 0} statements`);

    return NextResponse.json({ statements: statements ?? [] });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
