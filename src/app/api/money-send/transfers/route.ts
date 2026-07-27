import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /api/money-send/transfers
// Create a new money transfer (internal or interbank)
// ============================================================================
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
      external_account_id,
      transfer_type,
      amount,
      memo,
      description,
    } = body;

    console.log('API: Creating transfer:', {
      user_id: user.id,
      transfer_type,
      amount,
      from_account_id,
    });

    // ========================================================================
    // 1. VALIDATION
    // ========================================================================

    // Require idempotency key
    if (!idempotency_key) {
      return NextResponse.json(
        { error: 'idempotency_key is required' },
        { status: 400 }
      );
    }

    // Check for duplicate (idempotency)
    const { data: existingTransfer } = await supabase
      .from('transfers')
      .select('*')
      .eq('idempotency_key', idempotency_key)
      .single();

    if (existingTransfer) {
      console.log('API: Returning existing transfer (idempotency)');
      return NextResponse.json({
        transfer: existingTransfer,
        message: 'Transfer already exists',
      });
    }

    // Validate required fields
    if (!from_account_id || !transfer_type || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate transfer type
    if (!['internal', 'interbank'].includes(transfer_type)) {
      return NextResponse.json(
        { error: 'Invalid transfer_type' },
        { status: 400 }
      );
    }

    // Validate destination
    if (transfer_type === 'internal' && !to_account_id) {
      return NextResponse.json(
        { error: 'to_account_id required for internal transfers' },
        { status: 400 }
      );
    }

    if (transfer_type === 'interbank' && !external_account_id) {
      return NextResponse.json(
        { error: 'external_account_id required for interbank transfers' },
        { status: 400 }
      );
    }

    // Validate amount
    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // ========================================================================
    // 2. VERIFY OWNERSHIP OF FROM ACCOUNT
    // ========================================================================
    const { data: fromAccount, error: fromAccountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', from_account_id)
      .eq('user_id', user.id)
      .single();

    if (fromAccountError || !fromAccount) {
      return NextResponse.json(
        { error: 'Source account not found or unauthorized' },
        { status: 403 }
      );
    }

    // ========================================================================
    // 3. CHECK SAVINGS TRANSFER LIMIT (6/month)
    // ========================================================================
    if (fromAccount.account_type === 'savings') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentTransfers, error: transfersError } = await supabase
        .from('transfers')
        .select('id')
        .eq('from_account_id', from_account_id)
        .not('status', 'in', '(cancelled,failed)')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (transfersError) {
        console.error('Error checking savings limit:', transfersError);
      } else if (recentTransfers && recentTransfers.length >= 6) {
        return NextResponse.json(
          {
            error:
              'Savings account transfer limit reached. You can only make 6 transfers per month from your savings account.',
            error_code: 'SAVINGS_LIMIT_EXCEEDED',
            limit: 6,
            current_count: recentTransfers.length,
          },
          { status: 400 }
        );
      }
    }

    // ========================================================================
    // 4. CALCULATE FEES
    // ========================================================================
    let fee = 0;
    if (transfer_type === 'interbank') {
      // Flat fee for interbank transfers
      fee = 2.5;
    }

    const totalAmount = transferAmount + fee;

    // ========================================================================
    // 5. CHECK AVAILABLE BALANCE
    // ========================================================================
    // Get active holds
    const { data: activeHolds } = await supabase
      .from('holds')
      .select('amount')
      .eq('account_id', from_account_id)
      .eq('status', 'active')
      .eq('hold_type', 'outgoing');

    const totalHolds = activeHolds
      ? activeHolds.reduce((sum, hold) => sum + parseFloat(hold.amount), 0)
      : 0;

    const availableBalance = fromAccount.balance - totalHolds;

    if (availableBalance < totalAmount) {
      return NextResponse.json(
        {
          error: 'Insufficient available balance',
          required: totalAmount,
          available: availableBalance,
        },
        { status: 400 }
      );
    }

    // ========================================================================
    // 6. CHECK DAILY LIMIT
    // ========================================================================
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: todayTransfers } = await supabase
      .from('transfers')
      .select('amount')
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing', 'settled'])
      .gte('created_at', todayStart.toISOString());

    const todayTotal = todayTransfers
      ? todayTransfers.reduce((sum, t) => sum + parseFloat(t.amount), 0)
      : 0;

    const dailyLimit = 5000; // TODO: get from transfer_limits table

    if (todayTotal + transferAmount > dailyLimit) {
      return NextResponse.json(
        {
          error: 'Daily transfer limit exceeded',
          daily_limit: dailyLimit,
          used_today: todayTotal,
        },
        { status: 400 }
      );
    }

    // ========================================================================
    // 7. CHECK VERIFICATION REQUIREMENT
    // ========================================================================
    const verificationThreshold = 1000;
    const requiresVerification = transferAmount >= verificationThreshold;

    // ========================================================================
    // 8. CALCULATE SETTLEMENT DATE
    // ========================================================================
    const now = new Date();
    const scheduledSettlement = new Date(now);

    if (transfer_type === 'internal') {
      // 1 business day (skip weekends)
      scheduledSettlement.setDate(scheduledSettlement.getDate() + 1);
      while (
        scheduledSettlement.getDay() === 0 ||
        scheduledSettlement.getDay() === 6
      ) {
        scheduledSettlement.setDate(scheduledSettlement.getDate() + 1);
      }
    } else {
      // 3 business days for interbank
      let businessDays = 0;
      while (businessDays < 3) {
        scheduledSettlement.setDate(scheduledSettlement.getDate() + 1);
        if (
          scheduledSettlement.getDay() !== 0 &&
          scheduledSettlement.getDay() !== 6
        ) {
          businessDays++;
        }
      }
    }

    // ========================================================================
    // 9. CREATE TRANSFER RECORD
    // ========================================================================
    const transferData = {
      idempotency_key,
      user_id: user.id,
      from_account_id,
      to_account_id: transfer_type === 'internal' ? to_account_id : null,
      external_account_id:
        transfer_type === 'interbank' ? external_account_id : null,
      transfer_type,
      amount: transferAmount,
      fee,
      status: requiresVerification ? 'initiated' : 'pending',
      description: description || null,
      memo: memo || null,
      scheduled_settlement_at: scheduledSettlement.toISOString(),
      requires_verification: requiresVerification,
      ip_address: request.headers.get('x-forwarded-for') || null,
    };

    const { data: transfer, error: transferError } = await supabase
      .from('transfers')
      .insert(transferData)
      .select()
      .single();

    if (transferError || !transfer) {
      console.error('Error creating transfer:', transferError);
      return NextResponse.json(
        { error: 'Failed to create transfer' },
        { status: 500 }
      );
    }

    // ========================================================================
    // 10. CREATE HOLD (reduces available balance)
    // ========================================================================
    const { error: holdError } = await supabase.from('holds').insert({
      account_id: from_account_id,
      transfer_id: transfer.id,
      amount: totalAmount,
      hold_type: 'outgoing',
      status: 'active',
      description: `Hold for transfer ${transfer.id}`,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (holdError) {
      console.error('Error creating hold:', holdError);
      // Try to clean up transfer
      await supabase.from('transfers').delete().eq('id', transfer.id);
      return NextResponse.json(
        { error: 'Failed to create hold' },
        { status: 500 }
      );
    }

    // ========================================================================
    // 11. CREATE PENDING LEDGER ENTRIES
    // ========================================================================
    const newBalance = fromAccount.balance - totalAmount;

    // Debit entry for sender
    await supabase.from('ledger_entries').insert({
      transfer_id: transfer.id,
      account_id: from_account_id,
      entry_type: 'debit',
      amount: totalAmount,
      balance_after: newBalance,
      category: 'transfer',
      description: `Transfer ${transfer_type} - ${memo || 'No memo'}`,
      status: 'pending',
    });

    // Create transaction record for user's transaction history
    const reference = `SEND-${Date.now()}`;
    let transactionDescription = description || '';

    if (transfer_type === 'interbank' && external_account_id) {
      const { data: extAccount } = await supabase
        .from('external_accounts')
        .select('bank_name, account_number')
        .eq('id', external_account_id)
        .single();

      if (extAccount) {
        transactionDescription =
          description ||
          `Transfer to ${
            extAccount.bank_name
          } ****${extAccount.account_number.slice(-4)}`;
      }
    } else if (transfer_type === 'internal' && to_account_id) {
      const { data: toAcc } = await supabase
        .from('accounts')
        .select('account_type')
        .eq('id', to_account_id)
        .single();

      if (toAcc) {
        transactionDescription =
          description || `Transfer to ${toAcc.account_type} account`;
      }
    }

    await supabase.from('transactions').insert({
      user_id: user.id,
      account_id: from_account_id,
      transaction_type: 'transfer',
      direction: 'debit',
      amount: totalAmount,
      currency: 'USD',
      status: requiresVerification ? 'pending' : 'posted',
      description: transactionDescription,
      reference: reference,
      balance_after: newBalance,
      metadata: {
        fee: fee,
        original_amount: transferAmount,
        transfer_type: transfer_type,
        memo: memo,
        requires_verification: requiresVerification,
        external_account_id:
          transfer_type === 'interbank' ? external_account_id : null,
        transfer_id: transfer.id,
      },
    });

    // If internal, create pending credit for receiver
    if (transfer_type === 'internal' && to_account_id) {
      const { data: toAccount } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', to_account_id)
        .single();

      if (toAccount) {
        await supabase.from('ledger_entries').insert({
          transfer_id: transfer.id,
          account_id: to_account_id,
          entry_type: 'credit',
          amount: transferAmount,
          balance_after: toAccount.balance + transferAmount,
          category: 'transfer',
          description: `Transfer received - ${memo || 'No memo'}`,
          status: 'pending',
        });
      }
    }

    // ========================================================================
    // 12. CREATE ALERT
    // ========================================================================
    await supabase.from('alerts').insert({
      user_id: user.id,
      type: 'general',
      title: 'Transfer initiated',
      message: `Your transfer of $${transferAmount.toFixed(
        2
      )} has been initiated. ${
        requiresVerification
          ? 'Verification required to complete.'
          : 'Expected settlement: ' + scheduledSettlement.toLocaleDateString()
      }`,
      severity: 'info',
      is_read: false,
    });

    // ========================================================================
    // 13. SEND EMAIL NOTIFICATION
    // ========================================================================
    try {
      const { data: userData } = await supabase
        .from('bank_users')
        .select('email, full_name')
        .eq('id', user.id)
        .single();

      if (userData) {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/emails/transfer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userData.email,
            userName: userData.full_name,
            amount: totalAmount,
            recipient: transactionDescription,
            reference: reference,
          }),
        });
      }
    } catch (emailError) {
      console.error('Failed to send transfer email:', emailError);
    }

    console.log('API: Transfer created successfully:', transfer.id);

    return NextResponse.json({
      transfer,
      message: 'Transfer created successfully',
      requires_verification: requiresVerification,
      scheduled_settlement: scheduledSettlement,
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
// GET /api/money-send/transfers
// List user's transfers
// ============================================================================
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    let query = supabase
      .from('transfers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: transfers, error } = await query;

    if (error) {
      console.error('Error fetching transfers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transfers' },
        { status: 500 }
      );
    }

    return NextResponse.json({ transfers });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
