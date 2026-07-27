import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const round2 = (n: number) => Math.round(n * 100) / 100;
const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

// Places a market order against the catalogue price and settles it against the
// investment account's cash immediately. Buys debit cash and grow the position;
// sells credit cash and shrink it. Both write a public.transactions row so the
// activity also shows up in the normal transaction feed.
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
    const { symbol, side } = body;
    const quantity = round6(Number(body.quantity));

    if (!symbol || !side) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (side !== 'buy' && side !== 'sell') {
      return NextResponse.json(
        { error: 'Side must be buy or sell' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    // --- Account -------------------------------------------------------------
    const { data: account } = await supabase
      .from('accounts')
      .select('id, account_number, balance, status')
      .eq('user_id', user.id)
      .eq('account_type', 'investment')
      .maybeSingle();

    if (!account) {
      return NextResponse.json(
        { error: 'No investment account found' },
        { status: 400 }
      );
    }

    if (account.status !== 'active') {
      return NextResponse.json(
        { error: `Investment account is ${account.status}` },
        { status: 400 }
      );
    }

    // --- Asset ---------------------------------------------------------------
    const { data: asset } = await supabase
      .from('investment_assets')
      .select('symbol, name, price, is_active')
      .eq('symbol', symbol)
      .maybeSingle();

    if (!asset || !asset.is_active) {
      return NextResponse.json(
        { error: 'Unknown or inactive symbol' },
        { status: 400 }
      );
    }

    const price = Number(asset.price);
    const amount = round2(quantity * price);

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Order value must be greater than 0' },
        { status: 400 }
      );
    }

    // --- Existing position ---------------------------------------------------
    const { data: holding } = await supabase
      .from('investment_holdings')
      .select('id, quantity, average_cost')
      .eq('account_id', account.id)
      .eq('symbol', asset.symbol)
      .maybeSingle();

    const heldQuantity = holding ? Number(holding.quantity) : 0;
    const heldAverageCost = holding ? Number(holding.average_cost) : 0;
    const cash = Number(account.balance);

    if (side === 'buy' && amount > cash) {
      return NextResponse.json(
        {
          error: `Insufficient buying power. Available cash is $${cash.toFixed(
            2
          )}.`,
        },
        { status: 400 }
      );
    }

    if (side === 'sell' && quantity > heldQuantity) {
      return NextResponse.json(
        {
          error: `You only hold ${heldQuantity} ${asset.symbol}.`,
        },
        { status: 400 }
      );
    }

    const newCash = round2(side === 'buy' ? cash - amount : cash + amount);
    const newQuantity = round6(
      side === 'buy' ? heldQuantity + quantity : heldQuantity - quantity
    );

    // A sell realises P/L but leaves the average cost of what remains alone.
    const newAverageCost =
      side === 'buy'
        ? newQuantity > 0
          ? round2((heldQuantity * heldAverageCost + amount) / newQuantity)
          : 0
        : heldAverageCost;

    // --- 1. Move cash --------------------------------------------------------
    const { error: cashError } = await supabase
      .from('accounts')
      .update({ balance: newCash, updated_at: new Date().toISOString() })
      .eq('id', account.id);

    if (cashError) {
      console.error('Error updating investment cash:', cashError);
      return NextResponse.json({ error: 'Order failed' }, { status: 500 });
    }

    // --- 2. Move the position ------------------------------------------------
    const positionError = holding
      ? (
          await supabase
            .from('investment_holdings')
            .update({ quantity: newQuantity, average_cost: newAverageCost })
            .eq('id', holding.id)
        ).error
      : (
          await supabase.from('investment_holdings').insert({
            user_id: user.id,
            account_id: account.id,
            symbol: asset.symbol,
            quantity: newQuantity,
            average_cost: newAverageCost,
          })
        ).error;

    if (positionError) {
      console.error('Error updating holding:', positionError);
      // Put the cash back — the position never moved.
      await supabase
        .from('accounts')
        .update({ balance: cash })
        .eq('id', account.id);

      return NextResponse.json({ error: 'Order failed' }, { status: 500 });
    }

    // --- 3. Record the fill --------------------------------------------------
    const reference = `INV-${Date.now()}`;

    const { error: orderError } = await supabase
      .from('investment_orders')
      .insert({
        user_id: user.id,
        account_id: account.id,
        symbol: asset.symbol,
        side,
        quantity,
        price,
        amount,
        status: 'filled',
        reference,
      });

    if (orderError) {
      console.error('Error recording order:', orderError);
      return NextResponse.json({ error: 'Order failed' }, { status: 500 });
    }

    // --- 4. Transaction feed -------------------------------------------------
    const { error: txnError } = await supabase.from('transactions').insert({
      user_id: user.id,
      account_id: account.id,
      transaction_type: 'investment',
      direction: side === 'buy' ? 'debit' : 'credit',
      amount,
      currency: 'USD',
      status: 'posted',
      category: 'investments',
      description: `${side === 'buy' ? 'Bought' : 'Sold'} ${quantity} ${
        asset.symbol
      } @ $${price.toFixed(2)}`,
      reference,
      balance_after: newCash,
      metadata: {
        symbol: asset.symbol,
        side,
        quantity,
        price,
      },
    });

    if (txnError) {
      // The order itself settled; a missing feed row is not worth unwinding it.
      console.error('Error writing investment transaction:', txnError);
    }

    await supabase.from('alerts').insert({
      user_id: user.id,
      type: 'general',
      title: side === 'buy' ? 'Investment purchased' : 'Investment sold',
      message: `${side === 'buy' ? 'Bought' : 'Sold'} ${quantity} ${
        asset.symbol
      } for $${amount.toFixed(2)}.`,
      severity: 'success',
      is_read: false,
    });

    return NextResponse.json({
      success: true,
      order: {
        symbol: asset.symbol,
        side,
        quantity,
        price,
        amount,
        reference,
      },
      cash: newCash,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
