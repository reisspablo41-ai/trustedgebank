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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/simple-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';

type Transaction = {
  id: string;
  user_id: string;
  account_id: string;
  amount: number;
  type: string;
  category: string;
  description: string;
  status: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
  account_number?: string;
};

export default function AdminTransactionsPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, typeFilter, statusFilter, transactions]);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading transactions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load transactions.',
          variant: 'destructive',
        });
      } else {
        // Fetch user and account details
        const txnsWithDetails = await Promise.all(
          (data || []).map(async (txn) => {
            const { data: userData } = await supabase
              .from('bank_users')
              .select('email, full_name')
              .eq('id', txn.user_id)
              .single();

            const { data: accountData } = await supabase
              .from('accounts')
              .select('account_number')
              .eq('id', txn.account_id)
              .single();

            return {
              ...txn,
              user_email: userData?.email,
              user_name: userData?.full_name,
              account_number: accountData?.account_number,
            };
          })
        );

        setTransactions(txnsWithDetails);
        setFilteredTransactions(txnsWithDetails);
      }
    } catch (err) {
      console.error('Error:', err);
    }
    setLoading(false);
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (txn) =>
          txn.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          txn.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          txn.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          txn.account_number?.includes(searchTerm)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((txn) => txn.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((txn) => txn.status === statusFilter);
    }

    setFilteredTransactions(filtered);
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      deposit:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      withdrawal: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      transfer: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      payment:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };

    return (
      <Badge className={colors[type] || ''} variant="outline">
        {type}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalVolume = transactions.reduce(
    (sum, txn) => sum + Math.abs(txn.amount),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
        <p className="text-muted-foreground mt-1">
          View and monitor all platform transactions
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalVolume.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {transactions.filter((t) => t.amount > 0).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {transactions.filter((t) => t.amount < 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, account, or description..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="transfer">Transfer</option>
              <option value="payment">Payment</option>
            </select>

            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="posted">Posted</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Transactions ({filteredTransactions.length})
              </CardTitle>
              <CardDescription>
                Showing {filteredTransactions.length} of {transactions.length}{' '}
                transactions
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-sm">User</th>
                  <th className="pb-3 font-medium text-sm">Account</th>
                  <th className="pb-3 font-medium text-sm">Type</th>
                  <th className="pb-3 font-medium text-sm">Description</th>
                  <th className="pb-3 font-medium text-sm">Amount</th>
                  <th className="pb-3 font-medium text-sm">Status</th>
                  <th className="pb-3 font-medium text-sm">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((txn) => (
                    <tr key={txn.id} className="border-b last:border-0">
                      <td className="py-4">
                        <p className="font-medium text-sm">
                          {txn.user_name || 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {txn.user_email}
                        </p>
                      </td>
                      <td className="py-4">
                        <p className="font-mono text-sm">
                          ****{txn.account_number?.slice(-4) || 'N/A'}
                        </p>
                      </td>
                      <td className="py-4">{getTypeBadge(txn.type)}</td>
                      <td className="py-4">
                        <p className="text-sm max-w-xs truncate">
                          {txn.description || 'N/A'}
                        </p>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1">
                          {txn.amount > 0 ? (
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                          )}
                          <span
                            className={`font-semibold ${
                              txn.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            ${Math.abs(txn.amount).toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge
                          variant={
                            txn.status === 'posted' ? 'default' : 'secondary'
                          }
                          className="capitalize"
                        >
                          {txn.status}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <p className="text-sm text-muted-foreground">
                          {new Date(txn.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(txn.created_at).toLocaleTimeString()}
                        </p>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center">
                      <p className="text-muted-foreground">
                        No transactions found
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
