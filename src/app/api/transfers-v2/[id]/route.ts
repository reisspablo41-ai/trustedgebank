import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/transfers-v2/:id
 * Get detailed transfer information including events and ledger entries
 */
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

    // Get transfer
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

    // Get from account details
    const { data: fromAccount } = await supabase
      .from('accounts')
      .select('account_number, account_type')
      .eq('id', transfer.from_account_id)
      .single();

    // Get to account details (if internal)
    let toAccount = null;
    if (transfer.to_account_id) {
      const { data } = await supabase
        .from('accounts')
        .select('account_number, account_type')
        .eq('id', transfer.to_account_id)
        .single();
      toAccount = data;
    }

    // Get holds
    const { data: holds } = await supabase
      .from('holds')
      .select('*')
      .eq('transfer_id', transferId)
      .order('created_at', { ascending: false });

    // Get ledger entries
    const { data: ledgerEntries } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('transfer_id', transferId)
      .order('created_at', { ascending: false });

    // Get transfer events (status changes)
    const { data: events } = await supabase
      .from('transfer_events')
      .select('*')
      .eq('transfer_id', transferId)
      .order('created_at', { ascending: false });

    // Calculate progress
    const statusOrder = ['initiated', 'pending', 'processing', 'settled'];
    const currentIndex = statusOrder.indexOf(transfer.status);
    const progress =
      transfer.status === 'failed' || transfer.status === 'cancelled'
        ? 0
        : transfer.status === 'settled'
        ? 100
        : ((currentIndex + 1) / statusOrder.length) * 100;

    return NextResponse.json({
      transfer,
      from_account: fromAccount,
      to_account: toAccount,
      holds: holds || [],
      ledger_entries: ledgerEntries || [],
      events: events || [],
      progress,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/transfers-v2/:id
 * Update transfer status (for cancellation or MFA verification)
 */
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
    const { action, mfa_code } = body; // action: 'cancel', 'verify_mfa'

    // Get transfer
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

    // Handle cancellation
    if (action === 'cancel') {
      if (transfer.status !== 'initiated' && transfer.status !== 'pending') {
        return NextResponse.json(
          { error: 'Transfer cannot be cancelled at this stage' },
          { status: 400 }
        );
      }

      // Update transfer status
      const { error: updateError } = await supabase
        .from('transfers')
        .update({ status: 'cancelled' })
        .eq('id', transferId);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to cancel transfer' },
          { status: 500 }
        );
      }

      // Release holds
      await supabase
        .from('holds')
        .update({ status: 'released', released_at: new Date().toISOString() })
        .eq('transfer_id', transferId)
        .eq('status', 'active');

      // Create ledger entry for release
      const { data: hold } = await supabase
        .from('holds')
        .select('*')
        .eq('transfer_id', transferId)
        .eq('hold_type', 'outgoing')
        .single();

      if (hold) {
        await supabase.from('ledger_entries').insert({
          transfer_id: transferId,
          account_id: transfer.from_account_id,
          user_id: user.id,
          entry_type: 'release',
          amount: hold.amount,
          balance_after: 0, // Would need to recalculate
          category: 'transfer_release',
          description: 'Transfer cancelled - funds released',
          reference: transfer.reference,
        });

        // Restore available balance
        const { data: account } = await supabase
          .from('accounts')
          .select('balance, available_balance')
          .eq('id', transfer.from_account_id)
          .single();

        if (account) {
          await supabase
            .from('accounts')
            .update({
              available_balance:
                account.available_balance + parseFloat(hold.amount.toString()),
            })
            .eq('id', transfer.from_account_id);
        }
      }

      // Create alert
      await supabase.from('alerts').insert({
        user_id: user.id,
        type: 'general',
        title: 'Transfer cancelled',
        message: `Transfer of $${transfer.amount} has been cancelled. Funds have been released back to your available balance.`,
        severity: 'info',
        is_read: false,
      });

      return NextResponse.json({
        message: 'Transfer cancelled successfully',
        transfer: { ...transfer, status: 'cancelled' },
      });
    }

    // Handle MFA verification
    if (action === 'verify_mfa') {
      if (!transfer.requires_mfa) {
        return NextResponse.json(
          { error: 'MFA not required for this transfer' },
          { status: 400 }
        );
      }

      if (transfer.mfa_verified) {
        return NextResponse.json(
          { error: 'MFA already verified' },
          { status: 400 }
        );
      }

      // TODO: Verify MFA code here (integrate with your MFA provider)
      // For now, we'll just accept any code for demonstration
      if (!mfa_code || mfa_code.length < 6) {
        return NextResponse.json(
          { error: 'Invalid MFA code' },
          { status: 400 }
        );
      }

      // Update transfer
      const { error: updateError } = await supabase
        .from('transfers')
        .update({
          mfa_verified: true,
          status: 'pending',
        })
        .eq('id', transferId);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to verify MFA' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'MFA verified successfully - transfer is now pending',
        transfer: { ...transfer, mfa_verified: true, status: 'pending' },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
