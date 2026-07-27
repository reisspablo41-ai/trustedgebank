import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Portfolio snapshot: the investment account's cash, its positions priced at
// the current catalogue price, and recent fills.
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

    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, account_number, balance, status, currency')
      .eq('user_id', user.id)
      .eq('account_type', 'investment')
      .maybeSingle();

    if (accountError) {
      console.error('Error loading investment account:', accountError);
      return NextResponse.json(
        { error: 'Could not load investment account' },
        { status: 500 }
      );
    }

    // Approved before investment accounts existed, or KYC not approved yet.
    if (!account) {
      return NextResponse.json({
        account: null,
        holdings: [],
        orders: [],
        assets: [],
        totals: { cash: 0, positions: 0, portfolio: 0, cost_basis: 0 },
      });
    }

    const [holdingsResult, assetsResult, ordersResult] = await Promise.all([
      supabase
        .from('investment_holdings')
        .select('id, symbol, quantity, average_cost, updated_at')
        .eq('account_id', account.id)
        .gt('quantity', 0),
      supabase
        .from('investment_assets')
        .select('symbol, name, asset_class, price, previous_close, currency')
        .eq('is_active', true)
        .order('symbol', { ascending: true }),
      supabase
        .from('investment_orders')
        .select('id, symbol, side, quantity, price, amount, status, reference, created_at')
        .eq('account_id', account.id)
        .order('created_at', { ascending: false })
        .limit(25),
    ]);

    const assets = assetsResult.data ?? [];
    const assetBySymbol = new Map(assets.map((a) => [a.symbol, a]));

    const holdings = (holdingsResult.data ?? []).map((holding) => {
      const asset = assetBySymbol.get(holding.symbol);
      const price = Number(asset?.price ?? 0);
      const previousClose = Number(asset?.previous_close ?? price);
      const quantity = Number(holding.quantity);
      const averageCost = Number(holding.average_cost);

      const marketValue = quantity * price;
      const costBasis = quantity * averageCost;

      return {
        id: holding.id,
        symbol: holding.symbol,
        name: asset?.name ?? holding.symbol,
        asset_class: asset?.asset_class ?? 'stock',
        quantity,
        average_cost: averageCost,
        price,
        previous_close: previousClose,
        market_value: marketValue,
        cost_basis: costBasis,
        gain_loss: marketValue - costBasis,
        gain_loss_percent: costBasis > 0 ? ((marketValue - costBasis) / costBasis) * 100 : 0,
        day_change: quantity * (price - previousClose),
      };
    });

    const cash = Number(account.balance);
    const positions = holdings.reduce((sum, h) => sum + h.market_value, 0);
    const costBasis = holdings.reduce((sum, h) => sum + h.cost_basis, 0);
    const dayChange = holdings.reduce((sum, h) => sum + h.day_change, 0);

    return NextResponse.json({
      account: {
        id: account.id,
        account_number: account.account_number,
        balance: cash,
        status: account.status,
        currency: account.currency,
      },
      holdings: holdings.sort((a, b) => b.market_value - a.market_value),
      orders: ordersResult.data ?? [],
      assets,
      totals: {
        cash,
        positions,
        portfolio: cash + positions,
        cost_basis: costBasis,
        gain_loss: positions - costBasis,
        gain_loss_percent: costBasis > 0 ? ((positions - costBasis) / costBasis) * 100 : 0,
        day_change: dayChange,
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
