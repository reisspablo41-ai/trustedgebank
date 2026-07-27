import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const { from_account_id, to_account_id, amount, description } = body;

    // Validation
    if (!from_account_id || !to_account_id || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    if (from_account_id === to_account_id) {
      return NextResponse.json(
        { error: 'Cannot transfer to the same account' },
        { status: 400 }
      );
    }

    console.log('API: Processing transfer:', {
      user_id: user.id,
      from: from_account_id,
      to: to_account_id,
      amount,
    });

    // Verify both accounts belong to user
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, account_type, balance')
      .eq('user_id', user.id)
      .in('id', [from_account_id, to_account_id]);

    if (accountsError || !accounts || accounts.length !== 2) {
      return NextResponse.json({ error: 'Invalid accounts' }, { status: 400 });
    }

    const fromAccount = accounts.find((a) => a.id === from_account_id);
    const toAccount = accounts.find((a) => a.id === to_account_id);

    if (!fromAccount || !toAccount) {
      return NextResponse.json(
        { error: 'Accounts not found' },
        { status: 400 }
      );
    }

    // Check sufficient balance
    if (fromAccount.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // 1. Deduct from source account
    const { error: debitError } = await supabase
      .from('accounts')
      .update({ balance: fromAccount.balance - amount })
      .eq('id', from_account_id);

    if (debitError) {
      console.error('Error debiting from account:', debitError);
      return NextResponse.json({ error: 'Transfer failed' }, { status: 500 });
    }

    // 2. Add to destination account
    const { error: creditError } = await supabase
      .from('accounts')
      .update({ balance: toAccount.balance + amount })
      .eq('id', to_account_id);

    if (creditError) {
      console.error('Error crediting to account:', creditError);
      // Rollback - add money back to source
      await supabase
        .from('accounts')
        .update({ balance: fromAccount.balance })
        .eq('id', from_account_id);

      return NextResponse.json({ error: 'Transfer failed' }, { status: 500 });
    }

    const newFromBalance = fromAccount.balance - amount;
    const newToBalance = toAccount.balance + amount;
    const reference = `TXN-${Date.now()}`;

    // 3. Create debit transaction
    const debitTransactionData = {
      user_id: user.id,
      account_id: from_account_id,
      transaction_type: 'transfer',
      direction: 'debit',
      amount: amount,
      currency: 'USD',
      status: 'posted',
      description:
        description || `Transfer to ${toAccount.account_type} account`,
      reference: reference,
      balance_after: newFromBalance,
      metadata: {
        from_account_type: fromAccount.account_type,
        to_account_type: toAccount.account_type,
        transfer_type: 'internal',
      },
    };

    console.log(
      '🔍 [API TRANSFERS] Creating debit transaction:',
      debitTransactionData
    );

    const { data: debitData, error: debitTxnError } = await supabase
      .from('transactions')
      .insert(debitTransactionData);

    if (debitTxnError) {
      console.error(
        '❌ [API TRANSFERS] Debit transaction error:',
        debitTxnError
      );
      console.error(
        '❌ [API TRANSFERS] Error details:',
        JSON.stringify(debitTxnError, null, 2)
      );
      throw new Error(
        `Failed to create debit transaction: ${debitTxnError.message}`
      );
    }

    console.log('✅ [API TRANSFERS] Debit transaction created:', debitData);

    // 4. Create credit transaction
    const creditTransactionData = {
      user_id: user.id,
      account_id: to_account_id,
      transaction_type: 'transfer',
      direction: 'credit',
      amount: amount,
      currency: 'USD',
      status: 'posted',
      description:
        description || `Transfer from ${fromAccount.account_type} account`,
      reference: reference,
      balance_after: newToBalance,
      metadata: {
        from_account_type: fromAccount.account_type,
        to_account_type: toAccount.account_type,
        transfer_type: 'internal',
      },
    };

    console.log(
      '🔍 [API TRANSFERS] Creating credit transaction:',
      creditTransactionData
    );

    const { data: creditData, error: creditTxnError } = await supabase
      .from('transactions')
      .insert(creditTransactionData);

    if (creditTxnError) {
      console.error(
        '❌ [API TRANSFERS] Credit transaction error:',
        creditTxnError
      );
      console.error(
        '❌ [API TRANSFERS] Error details:',
        JSON.stringify(creditTxnError, null, 2)
      );
      throw new Error(
        `Failed to create credit transaction: ${creditTxnError.message}`
      );
    }

    console.log('✅ [API TRANSFERS] Credit transaction created:', creditData);

    // 5. Create alert
    await supabase.from('alerts').insert({
      user_id: user.id,
      type: 'general',
      title: 'Transfer completed',
      message: `$${amount.toFixed(2)} transferred from ${
        fromAccount.account_type
      } to ${toAccount.account_type}.`,
      severity: 'success',
      is_read: false,
    });

    // 6. Send email notification
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
            amount: amount,
            recipient: `${toAccount.account_type} account`,
            reference: reference,
          }),
        });
      }
    } catch (emailError) {
      console.error('Failed to send transfer email:', emailError);
    }

    console.log('API: Transfer completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Transfer completed successfully',
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
