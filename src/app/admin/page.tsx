'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supbaseClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  UserCheck,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type Metrics = {
  totalUsers: number;
  pendingKyc: number;
  totalDeposits: number;
  totalWithdrawals: number;
  activeAccounts: number;
  totalTransactions: number;
};

type MonthlyData = {
  month: string;
  deposits: number;
  withdrawals: number;
  savings: number;
};

type RecentActivity = {
  id: string;
  type: string;
  description: string;
  amount?: number;
  created_at: string;
};

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalUsers: 0,
    pendingKyc: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    activeAccounts: 0,
    totalTransactions: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get total users
      const { count: usersCount } = await supabase
        .from('bank_users')
        .select('*', { count: 'exact', head: true });

      // Get pending KYC
      const { count: pendingKycCount } = await supabase
        .from('bank_users')
        .select('*', { count: 'exact', head: true })
        .eq('kyc_status', 'pending');

      // Get active accounts
      const { count: accountsCount } = await supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true });

      // Get total transactions
      const { count: transactionsCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

      // Calculate deposits and withdrawals
      const { data: depositData } = await supabase
        .from('transactions')
        .select('amount')
        .in('type', ['deposit', 'transfer'])
        .gt('amount', 0);

      const { data: withdrawalData } = await supabase
        .from('transactions')
        .select('amount')
        .in('type', ['withdrawal', 'transfer', 'payment'])
        .lt('amount', 0);

      const totalDeposits =
        depositData?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
      const totalWithdrawals =
        withdrawalData?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

      setMetrics({
        totalUsers: usersCount || 0,
        pendingKyc: pendingKycCount || 0,
        totalDeposits,
        totalWithdrawals,
        activeAccounts: accountsCount || 0,
        totalTransactions: transactionsCount || 0,
      });

      // Get monthly transaction data for charts
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: monthlyTransactions } = await supabase
        .from('monthly_summaries')
        .select('*')
        .gte('month', sixMonthsAgo.toISOString())
        .order('month', { ascending: true })
        .limit(6);

      if (monthlyTransactions && monthlyTransactions.length > 0) {
        const chartData = monthlyTransactions.map((m) => ({
          month: new Date(m.month).toLocaleDateString('en-US', {
            month: 'short',
          }),
          deposits: m.income || 0,
          withdrawals: Math.abs(m.expenses || 0),
          savings: m.savings || 0,
        }));
        setMonthlyData(chartData);
      }

      // Get recent activity (transactions)
      const { data: recentTxns } = await supabase
        .from('transactions')
        .select('id, type, description, amount, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentTxns) {
        setRecentActivity(
          recentTxns.map((t) => ({
            id: t.id,
            type: t.type,
            description: t.description || 'Transaction',
            amount: t.amount,
            created_at: t.created_at,
          }))
        );
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Skeleton Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Skeleton Chart */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome to Admin Dashboard
        </h2>
        <p className="text-muted-foreground mt-2">
          Manage users, accounts, and monitor transactions across Trust Edge Bank.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered bank users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.pendingKyc.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Deposits
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.totalDeposits.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All-time deposits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Withdrawals
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.totalWithdrawals.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All-time withdrawals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Accounts
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.activeAccounts.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Checking & savings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalTransactions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Monthly Trends */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>
              Deposits, withdrawals, and savings over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="deposits"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="withdrawals"
                    stroke="#ef4444"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="savings"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No monthly data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest transactions across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex-1">
                    <p className="font-medium">{activity.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        activity.type === 'deposit' ? 'default' : 'secondary'
                      }
                    >
                      {activity.type}
                    </Badge>
                    {activity.amount && (
                      <span
                        className={`font-semibold ${
                          activity.amount > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {activity.amount > 0 ? '+' : ''}$
                        {Math.abs(activity.amount).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No recent activity
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
