import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/transfers-v2
 * Create a new transfer (internal or interbank)
 *
 * Request body:
 * {
 *   idempotency_key: string (required),
 *   from_account_id: uuid (required),
 *   to_account_id?: uuid (for internal),
 *   external_bank_name?: string (for interbank),
 *   external_routing_number?: string (for interbank),
 *   external_account_number?: string (for interbank),
 *   external_account_holder_name?: string (for interbank),
 *   amount: number (required),
 *   memo?: string,
 *   transfer_type: 'internal' | 'interbank' (required)
 * }
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      idempotency_key,
      from_account_id,
      to_account_id,
      external_bank_name,
      external_routing_number,
      external_account_number,
      external_account_holder_name,
      amount,
      memo,
      transfer_type,
    } = body;

    // ============================================
    // 1. VALIDATION
    // ============================================

    if (!idempotency_key || !from_account_id || !amount || !transfer_type) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: idempotency_key, from_account_id, amount, transfer_type',
        },
        { status: 400 }
      );
    }

    if (!['internal', 'interbank'].includes(transfer_type)) {
      return NextResponse.json(
        { error: 'transfer_type must be "internal" or "interbank"' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate internal vs external fields
    if (transfer_type === 'internal' && !to_account_id) {
      return NextResponse.json(
        { error: 'to_account_id required for internal transfers' },
        { status: 400 }
      );
    }

    if (transfer_type === 'interbank') {
      if (
        !external_bank_name ||
        !external_routing_number ||
        !external_account_number ||
        !external_account_holder_name
      ) {
        return NextResponse.json(
          { error: 'External bank details required for interbank transfers' },
          { status: 400 }
        );
      }
    }

    console.log('API: Creating transfer:', {
      user_id: user.id,
      idempotency_key,
      from_account_id,
      to_account_id,
      transfer_type,
      amount,
    });

    // ============================================
    // 2. IDEMPOTENCY CHECK
    // ============================================

    const { data: existingTransfer, error: idempotencyError } = await supabase
      .from('transfers')
      .select('*')
      .eq('idempotency_key', idempotency_key)
      .single();

    if (existingTransfer) {
      console.log(
        'API: Idempotent request - returning existing transfer:',
        existingTransfer.id
      );
      return NextResponse.json({
        transfer: existingTransfer,
        message: 'Transfer already exists (idempotent request)',
      });
    }

    // ============================================
    // 3. VERIFY ACCOUNT OWNERSHIP & BALANCE
    // ============================================

    const { data: fromAccount, error: fromAccountError } = await supabase
      .from('accounts')
      .select('id, account_type, balance, available_balance')
      .eq('id', from_account_id)
      .eq('user_id', user.id)
      .single();

    if (fromAccountError || !fromAccount) {
      return NextResponse.json(
        { error: 'Invalid from_account_id or account does not belong to user' },
        { status: 400 }
      );
    }

    // For internal transfers, verify to_account exists
    if (transfer_type === 'internal' && to_account_id) {
      const { data: toAccount, error: toAccountError } = await supabase
        .from('accounts')
        .select('id, user_id')
        .eq('id', to_account_id)
        .single();

      if (toAccountError || !toAccount) {
        return NextResponse.json(
          { error: 'Invalid to_account_id' },
          { status: 400 }
        );
      }

      // Prevent transfer to same account
      if (from_account_id === to_account_id) {
        return NextResponse.json(
          { error: 'Cannot transfer to the same account' },
          { status: 400 }
        );
      }
    }

    // ============================================
    // 4. CHECK SAVINGS TRANSFER LIMIT (6/month)
    // ============================================

    if (fromAccount.account_type === 'savings') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count, error: savingsCheckError } = await supabase
        .from('transfers')
        .select('*', { count: 'exact', head: true })
        .eq('from_account_id', from_account_id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .not('status', 'in', '("cancelled","failed")');

      if (savingsCheckError) {
        console.error('Error checking savings limit:', savingsCheckError);
      }

      if (count && count >= 6) {
        return NextResponse.json(
          {
            error: 'Savings account transfer limit exceeded',
            details:
              'Federal regulation limits savings account transfers to 6 per month. You have reached this limit. Consider using your checking account or contact support.',
            count,
            limit: 6,
          },
          { status: 429 }
        );
      }
    }

    // ============================================
    // 5. CALCULATE FEE
    // ============================================

    // Get transfer limits and fees for this user's tier (default: standard)
    const { data: limits } = await supabase
      .from('transfer_limits')
      .select('*')
      .eq('account_tier', 'standard')
      .eq('transfer_type', transfer_type)
      .single();

    let fee = 0;
    let requiresMfa = false;

    if (limits) {
      // Check min/max
      if (amount < limits.min_amount) {
        return NextResponse.json(
          { error: `Minimum transfer amount is $${limits.min_amount}` },
          { status: 400 }
        );
      }

      if (amount > limits.max_amount) {
        return NextResponse.json(
          { error: `Maximum transfer amount is $${limits.max_amount}` },
          { status: 400 }
        );
      }

      // Calculate fee
      fee = limits.flat_fee + amount * limits.percentage_fee;
      fee = Math.round(fee * 100) / 100; // Round to 2 decimals

      // Check MFA requirement
      if (limits.mfa_required_above && amount > limits.mfa_required_above) {
        requiresMfa = true;
      }
    }

    const totalAmount = amount + fee;

    // ============================================
    // 6. CHECK AVAILABLE BALANCE
    // ============================================

    // Calculate available balance (balance - active outgoing holds)
    const { data: activeHolds } = await supabase
      .from('holds')
      .select('amount')
      .eq('account_id', from_account_id)
      .eq('hold_type', 'outgoing')
      .eq('status', 'active');

    const totalHolds =
      activeHolds?.reduce(
        (sum, h) => sum + parseFloat(h.amount.toString()),
        0
      ) || 0;
    const availableBalance = fromAccount.balance - totalHolds;

    if (availableBalance < totalAmount) {
      return NextResponse.json(
        {
          error: 'Insufficient available balance',
          details: `Available: $${availableBalance.toFixed(
            2
          )}, Required: $${totalAmount.toFixed(2)} (including $${fee.toFixed(
            2
          )} fee)`,
          available_balance: availableBalance,
          required_amount: totalAmount,
        },
        { status: 400 }
      );
    }

    // ============================================
    // 7. CHECK DAILY LIMITS
    // ============================================

    if (limits) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: todaysTransfers } = await supabase
        .from('transfers')
        .select('amount')
        .eq('user_id', user.id)
        .eq('transfer_type', transfer_type)
        .gte('created_at', today.toISOString())
        .not('status', 'in', '("cancelled","failed")');

      const todaysCount = todaysTransfers?.length || 0;
      const todaysTotal =
        todaysTransfers?.reduce(
          (sum, t) => sum + parseFloat(t.amount.toString()),
          0
        ) || 0;

      if (todaysCount >= limits.daily_transaction_limit) {
        return NextResponse.json(
          {
            error: 'Daily transaction limit exceeded',
            details: `You have reached the daily limit of ${limits.daily_transaction_limit} transfers.`,
          },
          { status: 429 }
        );
      }

      if (todaysTotal + amount > limits.daily_amount_limit) {
        return NextResponse.json(
          {
            error: 'Daily amount limit exceeded',
            details: `Daily limit is $${
              limits.daily_amount_limit
            }. You have used $${todaysTotal.toFixed(2)} today.`,
          },
          { status: 429 }
        );
      }
    }

    // ============================================
    // 8. CALCULATE SETTLEMENT DATE
    // ============================================

    const now = new Date();
    let scheduledSettlementAt = new Date();

    if (transfer_type === 'internal') {
      // Internal: 1 business day
      scheduledSettlementAt.setDate(now.getDate() + 1);
    } else {
      // Interbank: 3-5 business days (using 4 as average)
      scheduledSettlementAt.setDate(now.getDate() + 4);
    }

    // ============================================
    // 9. CREATE TRANSFER RECORD
    // ============================================

    const { data: newTransfer, error: transferError } = await supabase
      .from('transfers')
      .insert({
        idempotency_key,
        user_id: user.id,
        from_account_id,
        to_account_id: transfer_type === 'internal' ? to_account_id : null,
        external_bank_name:
          transfer_type === 'interbank' ? external_bank_name : null,
        external_routing_number:
          transfer_type === 'interbank' ? external_routing_number : null,
        external_account_number:
          transfer_type === 'interbank' ? external_account_number : null,
        external_account_holder_name:
          transfer_type === 'interbank' ? external_account_holder_name : null,
        amount,
        fee,
        transfer_type,
        status: requiresMfa ? 'initiated' : 'pending',
        memo,
        scheduled_settlement_at: scheduledSettlementAt.toISOString(),
        requires_mfa: requiresMfa,
        mfa_verified: false,
      })
      .select()
      .single();

    if (transferError || !newTransfer) {
      console.error('Error creating transfer:', transferError);
      return NextResponse.json(
        { error: 'Failed to create transfer', details: transferError?.message },
        { status: 500 }
      );
    }

    console.log('API: Transfer created:', newTransfer.id);

    // ============================================
    // 10. CREATE OUTGOING HOLD
    // ============================================

    const { error: holdError } = await supabase.from('holds').insert({
      account_id: from_account_id,
      transfer_id: newTransfer.id,
      amount: totalAmount,
      hold_type: 'outgoing',
      status: 'active',
    });

    if (holdError) {
      console.error('Error creating hold:', holdError);
      // Rollback transfer
      await supabase.from('transfers').delete().eq('id', newTransfer.id);
      return NextResponse.json(
        { error: 'Failed to create hold', details: holdError.message },
        { status: 500 }
      );
    }

    console.log('API: Hold created for transfer');

    // ============================================
    // 11. CREATE LEDGER ENTRY (Hold)
    // ============================================

    const { error: ledgerError } = await supabase
      .from('ledger_entries')
      .insert({
        transfer_id: newTransfer.id,
        account_id: from_account_id,
        user_id: user.id,
        entry_type: 'hold',
        amount: totalAmount,
        balance_after: availableBalance - totalAmount,
        category: 'transfer_hold',
        description: `Transfer hold: ${memo || 'No memo'}`,
        reference: newTransfer.reference,
      });

    if (ledgerError) {
      console.error('Error creating ledger entry:', ledgerError);
    }

    // ============================================
    // 12. UPDATE ACCOUNT AVAILABLE BALANCE
    // ============================================

    const { error: balanceError } = await supabase
      .from('accounts')
      .update({
        available_balance: availableBalance - totalAmount,
        pending_balance: fromAccount.balance - (availableBalance - totalAmount),
      })
      .eq('id', from_account_id);

    if (balanceError) {
      console.error('Error updating available balance:', balanceError);
    }

    // ============================================
    // 13. CREATE ALERT
    // ============================================

    const settlementDays =
      transfer_type === 'internal' ? '1 business day' : '3-5 business days';

    await supabase.from('alerts').insert({
      user_id: user.id,
      type: 'general',
      title: 'Transfer initiated',
      message: `$${amount.toFixed(2)} transfer ${
        transfer_type === 'internal'
          ? 'to internal account'
          : 'to ' + external_bank_name
      } has been initiated. Expected settlement: ${settlementDays}. ${
        fee > 0 ? `Fee: $${fee.toFixed(2)}` : ''
      }`,
      severity: 'info',
      is_read: false,
    });

    console.log('API: Transfer completed successfully');

    // ============================================
    // 14. RETURN RESPONSE
    // ============================================

    return NextResponse.json(
      {
        transfer: newTransfer,
        message: requiresMfa
          ? 'Transfer created - MFA verification required'
          : 'Transfer initiated successfully',
        requires_mfa: requiresMfa,
        settlement_estimate: settlementDays,
        fee,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/transfers-v2
 * Get all transfers for the authenticated user
 * Query params:
 * - status: filter by status
 * - type: filter by transfer_type
 * - limit: number of results (default 50)
 */
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('transfers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('transfer_type', type);
    }

    const { data: transfers, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transfers: transfers || [] });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
