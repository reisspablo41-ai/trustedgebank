'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supbaseClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardNav } from '@/components/dashboard-nav';
import { useToast } from '@/components/ui/simple-toast';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  ArrowLeft,
} from 'lucide-react';

type Holding = {
  id: string;
  symbol: string;
  name: string;
  asset_class: string;
  quantity: number;
  average_cost: number;
  price: number;
  previous_close: number;
  market_value: number;
  cost_basis: number;
  gain_loss: number;
  gain_loss_percent: number;
  day_change: number;
};

type Asset = {
  symbol: string;
  name: string;
  asset_class: string;
  price: number;
  previous_close: number;
  currency: string;
};

type Order = {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  amount: number;
  status: string;
  reference: string | null;
  created_at: string;
};

type Portfolio = {
  account: {
    id: string;
    account_number: string;
    balance: number;
    status: string;
    currency: string;
  } | null;
  holdings: Holding[];
  orders: Order[];
  assets: Asset[];
  totals: {
    cash: number;
    positions: number;
    portfolio: number;
    cost_basis: number;
    gain_loss?: number;
    gain_loss_percent?: number;
    day_change?: number;
  };
};

const currency = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const signed = (n: number) => `${n < 0 ? '-' : '+'}${currency(Math.abs(n))}`;

export default function InvestmentsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  // Trade ticket
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    loadPortfolio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The sell list only contains symbols you actually hold, so a symbol carried
  // over from the buy list would leave the select with nothing selected.
  useEffect(() => {
    if (side !== 'sell' || !portfolio) return;

    const held = portfolio.holdings.map((h) => h.symbol);
    if (held.length > 0 && !held.includes(symbol)) {
      setSymbol(held[0]);
    }
  }, [side, portfolio, symbol]);

  const loadPortfolio = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch('/api/investments', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Could not load portfolio',
          description: data.error || 'Please try again.',
          variant: 'destructive',
        });
      } else {
        setPortfolio(data);
        if (!symbol && data.assets?.length) {
          setSymbol(data.assets[0].symbol);
        }
      }
    } catch (err) {
      console.error('Portfolio load error:', err);
      toast({
        title: 'Error',
        description: 'Something went wrong loading your portfolio.',
        variant: 'destructive',
      });
    }

    setLoading(false);
  };

  const selectedAsset = portfolio?.assets.find((a) => a.symbol === symbol);
  const selectedHolding = portfolio?.holdings.find((h) => h.symbol === symbol);
  const parsedQuantity = parseFloat(quantity);
  const estimatedValue =
    selectedAsset && Number.isFinite(parsedQuantity) && parsedQuantity > 0
      ? parsedQuantity * selectedAsset.price
      : 0;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!symbol || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      toast({
        title: 'Check your order',
        description: 'Pick an investment and enter a quantity above 0.',
        variant: 'destructive',
      });
      return;
    }

    setPlacing(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/investments/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ symbol, side, quantity: parsedQuantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Order not placed',
          description: data.error || 'Could not complete the order.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: side === 'buy' ? 'Purchase complete' : 'Sale complete',
          description: `${side === 'buy' ? 'Bought' : 'Sold'} ${
            data.order.quantity
          } ${data.order.symbol} for ${currency(data.order.amount)}.`,
        });
        setQuantity('');
        await loadPortfolio();
      }
    } catch (err) {
      console.error('Order error:', err);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }

    setPlacing(false);
  };

  if (loading) {
    return (
      <>
        <DashboardNav />
        <div className="mx-auto w-full max-w-7xl px-6 py-8 md:py-12 space-y-6">
          <Skeleton className="h-9 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-72" />
        </div>
      </>
    );
  }

  // KYC approved users get an investment account automatically; anyone else
  // lands here.
  if (!portfolio?.account) {
    return (
      <>
        <DashboardNav />
        <div className="mx-auto w-full max-w-3xl px-6 py-12">
          <Card>
            <CardHeader>
              <CardTitle>No investment account yet</CardTitle>
              <CardDescription>
                Investment accounts are opened once your identity check is
                approved.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <a href="/kyc">Submit documents</a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="/kyc/status">Check status</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const { account, holdings, orders, assets, totals } = portfolio;
  const gainLoss = totals.gain_loss ?? 0;
  const gainLossPercent = totals.gain_loss_percent ?? 0;
  const dayChange = totals.day_change ?? 0;

  return (
    <>
      <DashboardNav />
      <div className="mx-auto w-full max-w-7xl px-6 py-8 md:py-12">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.push('/dashboard')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Investments
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Account ****{account.account_number.slice(-4)} ·{' '}
              <span className="capitalize">{account.status}</span>
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/transfer')}
          >
            <Wallet className="mr-2 h-4 w-4" />
            Add cash
          </Button>
        </div>

        {/* Portfolio summary */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Portfolio Value</CardTitle>
                <CardDescription>Cash plus investments</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-semibold tracking-tight">
                  {currency(totals.portfolio)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {account.currency}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Buying Power</CardTitle>
                <CardDescription>Uninvested cash</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-semibold tracking-tight">
                  {currency(totals.cash)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Transfer in from checking to invest more
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Total Return</CardTitle>
                <CardDescription>Against cost basis</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div
                  className={`text-3xl font-semibold tracking-tight ${
                    gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {signed(gainLoss)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {gainLossPercent >= 0 ? '+' : ''}
                  {gainLossPercent.toFixed(2)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Today</CardTitle>
                <CardDescription>Change since last close</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div
                  className={`text-3xl font-semibold tracking-tight flex items-center gap-2 ${
                    dayChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {dayChange >= 0 ? (
                    <TrendingUp className="h-6 w-6" />
                  ) : (
                    <TrendingDown className="h-6 w-6" />
                  )}
                  {signed(dayChange)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Across {holdings.length}{' '}
                  {holdings.length === 1 ? 'holding' : 'holdings'}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Holdings */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Holdings</CardTitle>
                <CardDescription>
                  Positions priced at the latest close
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {holdings.length === 0 ? (
                  <div className="py-8 text-center">
                    <PiggyBank className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      You do not hold any investments yet. Place your first
                      order to get started.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground">
                          <th className="pb-2 font-medium">Investment</th>
                          <th className="pb-2 font-medium text-right">
                            Quantity
                          </th>
                          <th className="pb-2 font-medium text-right">Price</th>
                          <th className="pb-2 font-medium text-right">Value</th>
                          <th className="pb-2 font-medium text-right">
                            Return
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {holdings.map((holding) => (
                          <tr
                            key={holding.id}
                            className="border-b last:border-0"
                          >
                            <td className="py-3">
                              <div className="font-medium">
                                {holding.symbol}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {holding.name}
                              </div>
                            </td>
                            <td className="py-3 text-right tabular-nums">
                              {holding.quantity}
                              <div className="text-xs text-muted-foreground">
                                avg {currency(holding.average_cost)}
                              </div>
                            </td>
                            <td className="py-3 text-right tabular-nums">
                              {currency(holding.price)}
                            </td>
                            <td className="py-3 text-right tabular-nums font-medium">
                              {currency(holding.market_value)}
                            </td>
                            <td
                              className={`py-3 text-right tabular-nums font-medium ${
                                holding.gain_loss >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {signed(holding.gain_loss)}
                              <div className="text-xs font-normal">
                                {holding.gain_loss_percent >= 0 ? '+' : ''}
                                {holding.gain_loss_percent.toFixed(2)}%
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order history */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Orders</CardTitle>
                <CardDescription>Your last 25 fills</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No orders yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              order.side === 'buy' ? 'default' : 'secondary'
                            }
                            className="uppercase text-[10px]"
                          >
                            {order.side}
                          </Badge>
                          <div>
                            <div className="text-sm font-medium">
                              {order.quantity} {order.symbol}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()} ·{' '}
                              {currency(order.price)} each
                            </div>
                          </div>
                        </div>
                        <div
                          className={`text-sm font-semibold ${
                            order.side === 'buy'
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}
                        >
                          {order.side === 'buy' ? '-' : '+'}
                          {currency(order.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Trade ticket */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Place an Order</CardTitle>
                <CardDescription>
                  Orders fill immediately at the listed price
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={side === 'buy' ? 'default' : 'outline'}
                      onClick={() => setSide('buy')}
                    >
                      Buy
                    </Button>
                    <Button
                      type="button"
                      variant={side === 'sell' ? 'default' : 'outline'}
                      onClick={() => setSide('sell')}
                    >
                      Sell
                    </Button>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="symbol">Investment</Label>
                    <select
                      id="symbol"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      required
                    >
                      {(side === 'sell'
                        ? assets.filter((a) =>
                            holdings.some((h) => h.symbol === a.symbol)
                          )
                        : assets
                      ).map((asset) => (
                        <option key={asset.symbol} value={asset.symbol}>
                          {asset.symbol} — {currency(asset.price)}
                        </option>
                      ))}
                    </select>
                    {selectedAsset && (
                      <p className="text-xs text-muted-foreground">
                        {selectedAsset.name} ·{' '}
                        <span className="capitalize">
                          {selectedAsset.asset_class}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.000001"
                      min="0"
                      placeholder="0"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                    {side === 'sell' && selectedHolding && (
                      <button
                        type="button"
                        className="text-xs text-muted-foreground text-left hover:text-foreground"
                        onClick={() =>
                          setQuantity(String(selectedHolding.quantity))
                        }
                      >
                        You hold {selectedHolding.quantity} — sell all
                      </button>
                    )}
                  </div>

                  <div className="rounded-md border p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Estimated {side === 'buy' ? 'cost' : 'proceeds'}
                      </span>
                      <span className="font-medium">
                        {currency(estimatedValue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Cash after order
                      </span>
                      <span className="font-medium">
                        {currency(
                          side === 'buy'
                            ? totals.cash - estimatedValue
                            : totals.cash + estimatedValue
                        )}
                      </span>
                    </div>
                  </div>

                  {side === 'buy' && estimatedValue > totals.cash && (
                    <p className="text-xs text-red-600">
                      Not enough buying power. Transfer cash from your checking
                      account first.
                    </p>
                  )}

                  {side === 'sell' && holdings.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      You have nothing to sell yet.
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      placing ||
                      !symbol ||
                      (side === 'sell' && holdings.length === 0) ||
                      (side === 'buy' && estimatedValue > totals.cash)
                    }
                  >
                    {placing
                      ? 'Placing order...'
                      : `${side === 'buy' ? 'Buy' : 'Sell'} ${symbol}`}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Allocation</CardTitle>
                <CardDescription>Share of portfolio value</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {totals.portfolio === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Fund your account to see your allocation.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {[
                      ...holdings.map((h) => ({
                        key: h.symbol,
                        label: h.symbol,
                        value: h.market_value,
                      })),
                      { key: '__cash', label: 'Cash', value: totals.cash },
                    ]
                      .filter((row) => row.value > 0)
                      .map((row) => {
                        const percent = (row.value / totals.portfolio) * 100;
                        return (
                          <div key={row.key}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{row.label}</span>
                              <span className="text-muted-foreground">
                                {percent.toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
