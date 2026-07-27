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
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Download,
  Send,
  DollarSign,
  AlertCircle,
  Settings as SettingsIcon,
} from 'lucide-react';
import { DashboardNav } from '@/components/dashboard-nav';
import { useToast } from '@/components/ui/simple-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

type Account = {
  id: string;
  account_number: string;
  account_type: 'checking' | 'savings' | 'investment';
  balance: number;
};

type Transaction = {
  id: string;
  amount: number;
  direction: 'credit' | 'debit';
  transaction_type: string;
  description: string;
  created_at: string;
  balance_after?: number;
  status: string;
  reference: string;
};

type SpendingCategory = {
  name: string;
  value: number;
  color: string;
};

type MonthlyData = {
  month: string;
  income: number;
  expenses: number;
};

type Alert = {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
};

type SavingsGoal = {
  id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
};

type Statement = {
  id: string;
  statement_month: string;
  file_url: string;
  file_type: string;
};

// Generate monthly trend data from transactions
function generateMonthlyTrendData(transactions: Transaction[]): MonthlyData[] {
  const monthlyData: { [key: string]: { income: number; expenses: number } } =
    {};

  // Get last 6 months
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    months.push(date);
  }

  // Initialize monthly data
  months.forEach((month) => {
    const key = month.toISOString().slice(0, 7); // YYYY-MM format
    monthlyData[key] = { income: 0, expenses: 0 };
  });

  // Process transactions
  transactions.forEach((transaction) => {
    const transactionDate = new Date(transaction.created_at);
    const monthKey = transactionDate.toISOString().slice(0, 7);

    if (monthlyData[monthKey]) {
      if (transaction.direction === 'credit') {
        monthlyData[monthKey].income += transaction.amount;
      } else if (transaction.direction === 'debit') {
        monthlyData[monthKey].expenses += transaction.amount;
      }
    }
  });

  // Convert to array format
  return months.map((month) => {
    const key = month.toISOString().slice(0, 7);
    const data = monthlyData[key] || { income: 0, expenses: 0 };
    return {
      month: month.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
      income: Math.round(data.income * 100) / 100,
      expenses: Math.round(data.expenses * 100) / 100,
    };
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<string>('pending');
  const [userName, setUserName] = useState('');
  const [spendingByCategory, setSpendingByCategory] = useState<
    SpendingCategory[]
  >([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netIncome, setNetIncome] = useState(0);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [savingsGoal, setSavingsGoal] = useState<SavingsGoal | null>(null);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [pendingRefundsAmount, setPendingRefundsAmount] = useState(0);
  // accounts.balance for the investment account is cash only, so the portfolio
  // figure has to come from /api/investments.
  const [investmentPortfolio, setInvestmentPortfolio] = useState<number | null>(
    null
  );

  // Transfer form state
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromAccountId || !toAccountId || !transferAmount) {
      toast({
        title: 'Validation error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    setTransferring(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast({
          title: 'Error',
          description: 'Please log in again.',
          variant: 'destructive',
        });
        setTransferring(false);
        return;
      }

      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          from_account_id: fromAccountId,
          to_account_id: toAccountId,
          amount,
          description: transferNote,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Transfer failed',
          description: data.error || 'Could not complete transfer.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Transfer successful',
          description: `$${amount.toFixed(2)} transferred successfully.`,
        });

        // Reset form
        setTransferAmount('');
        setTransferNote('');

        // Reload dashboard data
        await loadDashboardData();
      }
    } catch (err) {
      console.error('Transfer error:', err);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setTransferring(false);
    }
  };

  const loadDashboardData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    // Get access token for API calls
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      router.replace('/auth/login');
      return;
    }

    // Get user info
    const { data: bankUser } = await supabase
      .from('bank_users')
      .select('kyc_status, full_name')
      .eq('id', user.id)
      .single();

    const status = bankUser?.kyc_status ?? 'pending';
    setKycStatus(status);
    setUserName(bankUser?.full_name || user.email || '');

    if (status === 'approved') {
      try {
        // Fetch all dashboard data from API
        console.log('🔄 Calling API /api/dashboard/data for user:', user.id);

        const response = await fetch('/api/dashboard/data', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          console.error('❌ API error:', response.statusText);
          setLoading(false);
          return;
        }

        const dashboardData = await response.json();
        console.log('✅ Dashboard data received from API:', dashboardData);

        // Log each data type with details
        console.log('📊 ACCOUNTS:', dashboardData.accounts);
        console.log('💳 TRANSACTIONS:', dashboardData.transactions);
        console.log('📈 SUMMARIES:', dashboardData.summaries);
        console.log('🔔 ALERTS:', dashboardData.alerts);
        console.log('💰 GOAL:', dashboardData.goal);
        console.log('📄 STATEMENTS:', dashboardData.statements);

        // Set state
        setAccounts(dashboardData.accounts || []);
        setTransactions(dashboardData.transactions || []);
        setAlerts(dashboardData.alerts || []);
        setSavingsGoal(dashboardData.goal);
        setStatements(dashboardData.statements || []);

        // Investment portfolio value (cash + positions)
        try {
          const investmentsResponse = await fetch('/api/investments', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (investmentsResponse.ok) {
            const investmentsData = await investmentsResponse.json();
            setInvestmentPortfolio(investmentsData.totals?.portfolio ?? null);
          }
        } catch (investmentsError) {
          console.error('Failed to load investments:', investmentsError);
        }

        // Generate monthly trend data from transactions
        console.log('📊 Generating monthly trend data...');
        const monthlyTrendData = generateMonthlyTrendData(transactions);
        console.log('📊 Monthly trend data:', monthlyTrendData);

        // Use real data only - no sample data
        setMonthlyTrend(monthlyTrendData);

        // Fetch income/expense data
        console.log('🔄 Calling API /api/dashboard/income-expense');
        const incomeExpenseResponse = await fetch(
          '/api/dashboard/income-expense',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const incomeExpenseData = await incomeExpenseResponse.json();
        if (incomeExpenseResponse.ok || incomeExpenseData) {
          console.log('💰 INCOME/EXPENSE DATA:', incomeExpenseData);
          if (incomeExpenseData._error) {
            console.warn(
              '⚠️ Income/expense query had an error:',
              incomeExpenseData._error
            );
          }
          console.log(
            '💰 EXPENSE CATEGORIES:',
            incomeExpenseData.expenseCategories
          );

          // Use real data only - no sample data
          setSpendingByCategory(incomeExpenseData.expenseCategories || []);

          setTotalIncome(incomeExpenseData.totalIncome || 0);
          setTotalExpenses(incomeExpenseData.totalExpenses || 0);
          setNetIncome(incomeExpenseData.netIncome || 0);
        } else {
          console.error(
            '❌ Failed to fetch income/expense data:',
            incomeExpenseResponse.status
          );
          // No sample data - keep empty arrays
          setSpendingByCategory([]);
        }

        // Fetch pending refunds (not cancelled, failed, or completed)
        console.log('🔄 Fetching pending refunds for user:', user.id);
        const { data: refunds, error: refundsError } = await supabase
          .from('refunds')
          .select('amount_cents, status')
          .eq('user_id', user.id)
          .in('status', ['pending', 'approved']);

        if (refundsError) {
          console.error('❌ Error fetching refunds:', refundsError);
          console.error(
            '❌ Refunds error details:',
            JSON.stringify(refundsError, null, 2)
          );
        } else {
          const pendingAmount =
            (refunds || []).reduce((sum, r) => sum + r.amount_cents, 0) / 100;
          console.log('💵 PENDING REFUNDS:', refunds);
          console.log('💵 TOTAL PENDING AMOUNT:', pendingAmount);
          console.log('💵 Refunds count:', (refunds || []).length);
          setPendingRefundsAmount(pendingAmount);
        }

        console.log('✅ ALL DASHBOARD DATA LOADED SUCCESSFULLY');
      } catch (err) {
        console.error('❌ Error loading dashboard:', err);
      }
    }
    setLoading(false);
  };

  // Show loading skeletons
  if (loading) {
    return (
      <>
        <DashboardNav />
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-48 mb-6" />

          {/* Skeleton Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-28" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Skeleton Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </>
    );
  }

  // If KYC not approved, show gating message
  if (kycStatus !== 'approved') {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">
          Complete KYC to access your accounts.
        </p>
        <div className="mt-8 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="secondary">KYC Pending</Badge> Verification in
                progress
              </CardTitle>
              <CardDescription>
                Complete identity verification to unlock your accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <p className="text-sm text-muted-foreground">
                Your identity verification is pending. Submit your documents to
                activate your checking and savings accounts.
              </p>
              <div className="flex gap-3">
                <Button asChild size="sm">
                  <a href="/kyc">Submit documents</a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href="/kyc/status">Check status</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Get individual account balances
  const checkingAccount = accounts.find(
    (acc) => acc.account_type === 'checking'
  );
  const savingsAccount = accounts.find((acc) => acc.account_type === 'savings');
  const investmentAccount = accounts.find(
    (acc) => acc.account_type === 'investment'
  );

  // What the investment account holds on top of its cash. accounts.balance
  // already contributes the cash side, so only the positions are added here.
  const investmentPositions =
    investmentPortfolio !== null && investmentAccount
      ? investmentPortfolio - investmentAccount.balance
      : 0;

  // Calculate totals
  const totalBalance =
    accounts.reduce((sum, acc) => sum + acc.balance, 0) + investmentPositions ||
    0;

  console.log('Dashboard balances:', {
    accounts,
    totalBalance,
    checkingAccount,
    savingsAccount,
    investmentAccount,
  });

  return (
    <>
      <DashboardNav />
      <div className="mx-auto w-full max-w-7xl px-6 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Welcome back, {userName.split(' ')[0]}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <a href="/settings">
              <SettingsIcon className="mr-2 h-4 w-4" />
              Settings
            </a>
          </Button>
        </div>

        {/* 1. Account Overview */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Account Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* Total Balance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Total Balance</CardTitle>
                <CardDescription>Across all accounts</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-semibold tracking-tight">
                  ${totalBalance.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">USD</p>
              </CardContent>
            </Card>

            {/* Pending Balance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pending Balance</CardTitle>
                <CardDescription>Refunds processing</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-semibold tracking-tight text-amber-600">
                  ${pendingRefundsAmount.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  From pending refunds
                </p>
              </CardContent>
            </Card>

            {/* Checking Account */}
            {checkingAccount && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm capitalize flex items-center justify-between">
                    Checking
                    <Badge variant="outline" className="text-xs font-normal">
                      ****{checkingAccount.account_number.slice(-4)}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Everyday spending
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-semibold">
                    ${checkingAccount.balance.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Savings Account */}
            {savingsAccount && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm capitalize flex items-center justify-between">
                    Savings
                    <Badge variant="outline" className="text-xs font-normal">
                      ****{savingsAccount.account_number.slice(-4)}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Long-term savings
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-semibold">
                    ${savingsAccount.balance.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Investment Account */}
            {investmentAccount && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm capitalize flex items-center justify-between">
                    Investment
                    <Badge variant="outline" className="text-xs font-normal">
                      ****{investmentAccount.account_number.slice(-4)}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Portfolio value
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-semibold">
                    $
                    {(
                      investmentPortfolio ?? investmentAccount.balance
                    ).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ${investmentAccount.balance.toFixed(2)} cash available
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => router.push('/dashboard/transfer')}
            >
              <Send className="h-5 w-5" />
              <span className="text-sm">Transfer</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => router.push('/dashboard/send-money')}
            >
              <ArrowUpRight className="h-5 w-5" />
              <span className="text-sm">Send Money</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => router.push('/dashboard/bills')}
            >
              <DollarSign className="h-5 w-5" />
              <span className="text-sm">Pay Bills</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => router.push('/dashboard/investments')}
            >
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm">Invest</span>
            </Button>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* 2. Recent Transactions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Recent Transactions
                  </CardTitle>
                  <Button variant="ghost" size="sm">
                    View all
                  </Button>
                </div>
                <CardDescription>
                  Latest activity on your accounts
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No transactions yet. Start using your account!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((txn) => (
                      <div
                        key={txn.id}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              txn.direction === 'credit'
                                ? 'bg-green-100 dark:bg-green-900/20'
                                : 'bg-red-100 dark:bg-red-900/20'
                            }`}
                          >
                            {txn.direction === 'credit' ? (
                              <ArrowDownRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium">
                              {txn.description || 'Transaction'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(txn.created_at).toLocaleDateString()} •{' '}
                              {txn.transaction_type || 'General'}
                            </div>
                          </div>
                        </div>
                        <div
                          className={`text-sm font-semibold ${
                            txn.direction === 'credit'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {txn.direction === 'credit' ? '+' : '-'}$
                          {Math.abs(txn.amount).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3. Spending Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Expense Breakdown</CardTitle>
                <CardDescription>
                  Your expense categories this month (Bill payments, transfers,
                  etc.)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pie Chart */}
                  <div>
                    <p className="text-sm font-medium mb-4">By Category</p>
                    {spendingByCategory.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={spendingByCategory}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {spendingByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                        <div className="text-center">
                          <p className="text-sm">No expense data</p>
                          <p className="text-xs">
                            Start spending to see categories
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Category List */}
                  <div>
                    <p className="text-sm font-medium mb-4">Top Categories</p>
                    {spendingByCategory.length > 0 ? (
                      <div className="space-y-3">
                        {spendingByCategory.map((cat) => (
                          <div
                            key={cat.name}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: cat.color }}
                              />
                              <span>{cat.name}</span>
                            </div>
                            <span className="font-medium">${cat.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No categories</p>
                        <p className="text-xs">Expenses will appear here</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Monthly Trend */}
                <Separator className="my-6 h-px" />
                <div>
                  <p className="text-sm font-medium mb-4">Income vs Expenses</p>
                  {monthlyTrend.some(
                    (item) => item.income > 0 || item.expenses > 0
                  ) ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={monthlyTrend}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-muted"
                        />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="income"
                          stroke="#00C49F"
                          strokeWidth={2}
                          name="Income"
                        />
                        <Line
                          type="monotone"
                          dataKey="expenses"
                          stroke="#FF8042"
                          strokeWidth={2}
                          name="Expenses"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                      <div className="text-center">
                        <p className="text-sm">No transaction data</p>
                        <p className="text-xs">
                          Income and expenses will appear here
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Current Month Income vs Expenses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  This Month’s Summary
                </CardTitle>
                <CardDescription>
                  Income vs Expenses for{' '}
                  {new Date().toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                      Total Income
                    </p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      ${totalIncome.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                      Total Expenses
                    </p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                      ${totalExpenses.toFixed(2)}
                    </p>
                  </div>
                  <div
                    className={`text-center p-4 rounded-lg ${
                      netIncome >= 0
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : 'bg-red-50 dark:bg-red-900/20'
                    }`}
                  >
                    <p
                      className={`text-sm font-medium ${
                        netIncome >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      Net Income
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        netIncome >= 0
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}
                    >
                      ${netIncome.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Simple bar chart for income vs expenses */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Income vs Expenses Breakdown
                  </p>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Income</span>
                        <span>${totalIncome.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width:
                              totalIncome > 0
                                ? `${Math.min(
                                    (totalIncome /
                                      Math.max(totalIncome, totalExpenses)) *
                                      100,
                                    100
                                  )}%`
                                : '0%',
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Expenses</span>
                        <span>${totalExpenses.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{
                            width:
                              totalExpenses > 0
                                ? `${Math.min(
                                    (totalExpenses /
                                      Math.max(totalIncome, totalExpenses)) *
                                      100,
                                    100
                                  )}%`
                                : '0%',
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 4. Transfers & Payments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Transfer</CardTitle>
                <CardDescription>Send money to another account</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <form onSubmit={handleTransfer} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fromAccount">From</Label>
                    <select
                      id="fromAccount"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={fromAccountId}
                      onChange={(e) => setFromAccountId(e.target.value)}
                      required
                    >
                      <option value="">Select account</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.account_type.charAt(0).toUpperCase() +
                            acc.account_type.slice(1)}{' '}
                          ****
                          {acc.account_number.slice(-4)} - $
                          {acc.balance.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="toAccount">To</Label>
                    <select
                      id="toAccount"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={toAccountId}
                      onChange={(e) => setToAccountId(e.target.value)}
                      required
                    >
                      <option value="">Select account</option>
                      {accounts
                        .filter((acc) => acc.id !== fromAccountId)
                        .map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.account_type.charAt(0).toUpperCase() +
                              acc.account_type.slice(1)}{' '}
                            ****
                            {acc.account_number.slice(-4)}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="note">Note (optional)</Label>
                    <Input
                      id="note"
                      placeholder="What's this for?"
                      value={transferNote}
                      onChange={(e) => setTransferNote(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={transferring}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {transferring ? 'Processing...' : 'Transfer Money'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* 7. Insights & Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {alerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No new insights. Keep up the good work!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => {
                      const severityConfig = {
                        success: {
                          bg: 'bg-green-50 dark:bg-green-900/10',
                          border: 'border-green-200 dark:border-green-900',
                          icon: TrendingUp,
                          iconColor: 'text-green-600',
                          titleColor: 'text-green-900 dark:text-green-100',
                          textColor: 'text-green-700 dark:text-green-300',
                        },
                        info: {
                          bg: 'bg-blue-50 dark:bg-blue-900/10',
                          border: 'border-blue-200 dark:border-blue-900',
                          icon: AlertCircle,
                          iconColor: 'text-blue-600',
                          titleColor: 'text-blue-900 dark:text-blue-100',
                          textColor: 'text-blue-700 dark:text-blue-300',
                        },
                        warning: {
                          bg: 'bg-amber-50 dark:bg-amber-900/10',
                          border: 'border-amber-200 dark:border-amber-900',
                          icon: AlertCircle,
                          iconColor: 'text-amber-600',
                          titleColor: 'text-amber-900 dark:text-amber-100',
                          textColor: 'text-amber-700 dark:text-amber-300',
                        },
                        error: {
                          bg: 'bg-red-50 dark:bg-red-900/10',
                          border: 'border-red-200 dark:border-red-900',
                          icon: AlertCircle,
                          iconColor: 'text-red-600',
                          titleColor: 'text-red-900 dark:text-red-100',
                          textColor: 'text-red-700 dark:text-red-300',
                        },
                      };

                      const config =
                        severityConfig[
                          alert.severity as keyof typeof severityConfig
                        ] || severityConfig.info;
                      const Icon = config.icon;

                      return (
                        <div
                          key={alert.id}
                          className={`p-3 ${config.bg} border ${config.border} rounded-md`}
                        >
                          <div className="flex items-start gap-2">
                            <Icon
                              className={`h-4 w-4 ${config.iconColor} mt-0.5`}
                            />
                            <div className="text-sm">
                              <p className={`font-medium ${config.titleColor}`}>
                                {alert.title}
                              </p>
                              <p className={`${config.textColor} text-xs mt-1`}>
                                {alert.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Savings Goal */}
            {savingsGoal && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Savings Goal</CardTitle>
                  <CardDescription>{savingsGoal.goal_name}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        ${savingsGoal.current_amount.toFixed(2)} / $
                        {savingsGoal.target_amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            (savingsGoal.current_amount /
                              savingsGoal.target_amount) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(
                        (savingsGoal.current_amount /
                          savingsGoal.target_amount) *
                          100
                      )}
                      % complete • $
                      {(
                        savingsGoal.target_amount - savingsGoal.current_amount
                      ).toFixed(2)}{' '}
                      to go
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 5. Statements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Statements</CardTitle>
                <CardDescription>Download account statements</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {statements.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No statements available yet.
                  </p>
                ) : (
                  <>
                    {statements.map((statement) => {
                      const monthDate = new Date(statement.statement_month);
                      const monthName = monthDate.toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      });
                      return (
                        <Button
                          key={statement.id}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          asChild
                        >
                          <a
                            href={statement.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            {monthName}
                          </a>
                        </Button>
                      );
                    })}
                    <Button variant="ghost" size="sm" className="w-full">
                      View all statements
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
