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
import { Search, Lock } from 'lucide-react';

type Account = {
  id: string;
  user_id: string;
  account_number: string;
  account_type: string;
  balance: number;
  created_at: string;
  user_email?: string;
  user_name?: string;
};

export default function AdminAccountsPage() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, typeFilter, accounts]);

  const loadAccounts = async () => {
    try {
      // Get accounts with user info
      const { data, error } = await supabase
        .from('accounts')
        .select(
          `
          id,
          user_id,
          account_number,
          account_type,
          balance,
          created_at
        `
        )
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading accounts:', error);
        toast({
          title: 'Error',
          description: 'Failed to load accounts.',
          variant: 'destructive',
        });
      } else {
        // Fetch user details separately
        const accountsWithUsers = await Promise.all(
          (data || []).map(async (account) => {
            const { data: userData } = await supabase
              .from('bank_users')
              .select('email, full_name')
              .eq('id', account.user_id)
              .single();

            return {
              ...account,
              user_email: userData?.email,
              user_name: userData?.full_name,
            };
          })
        );

        setAccounts(accountsWithUsers);
        setFilteredAccounts(accountsWithUsers);
      }
    } catch (err) {
      console.error('Error:', err);
    }
    setLoading(false);
  };

  const filterAccounts = () => {
    let filtered = accounts;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (account) =>
          account.account_number
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          account.user_email
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          account.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(
        (account) => account.account_type === typeFilter
      );
    }

    setFilteredAccounts(filtered);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Account Management
        </h2>
        <p className="text-muted-foreground mt-1">
          View and manage all user accounts
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Total Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalBalance.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Account Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p>
                Checking:{' '}
                {accounts.filter((a) => a.account_type === 'checking').length}
              </p>
              <p>
                Savings:{' '}
                {accounts.filter((a) => a.account_type === 'savings').length}
              </p>
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
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by account number, name, or email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Type Filter */}
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Accounts ({filteredAccounts.length})</CardTitle>
          <CardDescription>
            Showing {filteredAccounts.length} of {accounts.length} accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-sm">Account Number</th>
                  <th className="pb-3 font-medium text-sm">User</th>
                  <th className="pb-3 font-medium text-sm">Type</th>
                  <th className="pb-3 font-medium text-sm">Balance</th>
                  <th className="pb-3 font-medium text-sm">Created</th>
                  <th className="pb-3 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((account) => (
                    <tr key={account.id} className="border-b last:border-0">
                      <td className="py-4">
                        <p className="font-mono text-sm">
                          {account.account_number}
                        </p>
                      </td>
                      <td className="py-4">
                        <p className="font-medium text-sm">
                          {account.user_name || 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {account.user_email}
                        </p>
                      </td>
                      <td className="py-4">
                        <Badge variant="outline" className="capitalize">
                          {account.account_type}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <p className="font-semibold">
                          ${account.balance.toFixed(2)}
                        </p>
                      </td>
                      <td className="py-4">
                        <p className="text-sm text-muted-foreground">
                          {new Date(account.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" disabled>
                            <Lock className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center">
                      <p className="text-muted-foreground">No accounts found</p>
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
