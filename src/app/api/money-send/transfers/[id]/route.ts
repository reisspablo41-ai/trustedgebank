import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET /api/money-send/transfers/[id]
// Get transfer details with timeline/events
// ============================================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transferId } = await params;

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

    // transferId already extracted at the top

    // Fetch transfer
    const { data: transfer, error: transferError } = await supabase
      .from('transfers')
      .select('*')
      .eq('id', transferId)
      .eq('user_id', user.id)
      .single();

    if (transferError || !transfer) {
      return NextResponse.json(
        { error: 'Transfer not found' },
        { status: 404 }
      );
    }

    // Fetch events
    const { data: events } = await supabase
      .from('transfer_events')
      .select('*')
      .eq('transfer_id', transferId)
      .order('created_at', { ascending: false });

    // Fetch holds
    const { data: holds } = await supabase
      .from('holds')
      .select('*')
      .eq('transfer_id', transferId);

    // Fetch ledger entries
    const { data: ledgerEntries } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('transfer_id', transferId)
      .order('created_at', { ascending: false });

    // Fetch from account details
    const { data: fromAccount } = await supabase
      .from('accounts')
      .select('account_number, account_type')
      .eq('id', transfer.from_account_id)
      .single();

    // Fetch to account details (if internal)
    let toAccount = null;
    if (transfer.to_account_id) {
      const { data } = await supabase
        .from('accounts')
        .select('account_number, account_type')
        .eq('id', transfer.to_account_id)
        .single();
      toAccount = data;
    }

    // Fetch external account details (if interbank)
    let externalAccount = null;
    if (transfer.external_account_id) {
      const { data } = await supabase
        .from('external_accounts')
        .select('bank_name, account_holder_name, account_number_last4')
        .eq('id', transfer.external_account_id)
        .single();
      externalAccount = data;
    }

    return NextResponse.json({
      transfer,
      events: events || [],
      holds: holds || [],
      ledger_entries: ledgerEntries || [],
      from_account: fromAccount,
      to_account: toAccount,
      external_account: externalAccount,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/money-send/transfers/[id]
// Cancel a transfer (only if still in 'initiated' status)
// ============================================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transferId } = await params;

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

    // transferId already extracted at the top
    const body = await request.json();
    const { action } = body;

    if (action !== 'cancel') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Fetch transfer
    const { data: transfer, error: transferError } = await supabase
      .from('transfers')
      .select('*')
      .eq('id', transferId)
      .eq('user_id', user.id)
      .single();

    if (transferError || !transfer) {
      return NextResponse.json(
        { error: 'Transfer not found' },
        { status: 404 }
      );
    }

    // Can only cancel if initiated
    if (transfer.status !== 'initiated') {
      return NextResponse.json(
        { error: 'Cannot cancel transfer in current status' },
        { status: 400 }
      );
    }

    // Update transfer status
    const { error: updateError } = await supabase
      .from('transfers')
      .update({ status: 'cancelled' })
      .eq('id', transferId);

    if (updateError) {
      console.error('Error cancelling transfer:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel transfer' },
        { status: 500 }
      );
    }

    // Release hold
    await supabase
      .from('holds')
      .update({
        status: 'released',
        released_at: new Date().toISOString(),
      })
      .eq('transfer_id', transferId)
      .eq('status', 'active');

    // Create alert
    await supabase.from('alerts').insert({
      user_id: user.id,
      type: 'general',
      title: 'Transfer cancelled',
      message: `Your transfer of $${transfer.amount} has been cancelled and funds have been released.`,
      severity: 'info',
      is_read: false,
    });

    console.log('API: Transfer cancelled:', transferId);

    return NextResponse.json({
      message: 'Transfer cancelled successfully',
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
