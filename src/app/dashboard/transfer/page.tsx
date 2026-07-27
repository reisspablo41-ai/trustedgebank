'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/simple-toast';
import { ArrowLeft, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

type Account = {
  id: string;
  account_number: string;
  account_type: 'checking' | 'savings';
  balance: number;
};

export default function TransferPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);

  // Form state
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');

  // Step state
  const [step, setStep] = useState(1); // 1: Form, 2: Confirmation, 3: Success

  useEffect(() => {
    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAccounts = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/auth/login');
      return;
    }

    const { data: accountsData } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (accountsData) {
      setAccounts(accountsData);
      if (accountsData.length > 0) {
        setFromAccountId(accountsData[0].id);
      }
    }

    setLoading(false);
  };

  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);

  const handleNextStep = () => {
    // Validation
    if (!fromAccountId || !toAccountId || !amount) {
      toast({
        title: 'Validation error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    if (!fromAccount) {
      toast({
        title: 'Error',
        description: 'Please select a valid source account.',
        variant: 'destructive',
      });
      return;
    }

    if (fromAccount.balance < transferAmount) {
      toast({
        title: 'Insufficient balance',
        description: `Your ${fromAccount.account_type} account has insufficient funds.`,
        variant: 'destructive',
      });
      return;
    }

    setStep(2);
  };

  const handleConfirmTransfer = async () => {
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
          amount: parseFloat(amount),
          description: memo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Transfer failed',
          description: data.error || 'Could not complete transfer.',
          variant: 'destructive',
        });
        setTransferring(false);
      } else {
        setStep(3);
        setTransferring(false);
      }
    } catch (err) {
      console.error('Transfer error:', err);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
      setTransferring(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <p className="text-center text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push('/dashboard')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Transfer Money</h1>
        <p className="text-muted-foreground mt-2">
          Transfer funds between your accounts
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              1
            </div>
            <span className="ml-2 text-sm font-medium">Details</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              2
            </div>
            <span className="ml-2 text-sm font-medium">Confirm</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              3
            </div>
            <span className="ml-2 text-sm font-medium">Complete</span>
          </div>
        </div>
      </div>

      {/* Step 1: Form */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
            <CardDescription>
              Enter the transfer amount and select accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fromAccount">From Account</Label>
              <select
                id="fromAccount"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_type.charAt(0).toUpperCase() +
                      acc.account_type.slice(1)}{' '}
                    ****{acc.account_number.slice(-4)} - $
                    {acc.balance.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="toAccount">To Account</Label>
              <select
                id="toAccount"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
              >
                <option value="">Select account</option>
                {accounts
                  .filter((acc) => acc.id !== fromAccountId)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_type.charAt(0).toUpperCase() +
                        acc.account_type.slice(1)}{' '}
                      ****{acc.account_number.slice(-4)}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">
                  $
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-7"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              {fromAccount && amount && parseFloat(amount) > 0 && (
                <p className="text-sm text-muted-foreground">
                  Available: ${fromAccount.balance.toFixed(2)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="memo">Memo (optional)</Label>
              <Input
                id="memo"
                placeholder="What's this transfer for?"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>

            <Separator />

            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Cancel
              </Button>
              <Button onClick={handleNextStep}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Confirmation */}
      {step === 2 && fromAccount && toAccount && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm Transfer</CardTitle>
            <CardDescription>
              Please review and confirm the transfer details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">From</span>
                <div className="text-right">
                  <p className="font-medium">
                    {fromAccount.account_type.charAt(0).toUpperCase() +
                      fromAccount.account_type.slice(1)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ****{fromAccount.account_number.slice(-4)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">To</span>
                <div className="text-right">
                  <p className="font-medium">
                    {toAccount.account_type.charAt(0).toUpperCase() +
                      toAccount.account_type.slice(1)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ****{toAccount.account_number.slice(-4)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount</span>
                <p className="text-2xl font-bold">
                  ${parseFloat(amount).toFixed(2)}
                </p>
              </div>

              {memo && (
                <>
                  <Separator />
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-muted-foreground">Memo</span>
                    <p className="text-sm text-right max-w-xs">{memo}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  New Balance
                </span>
                <div className="text-right">
                  <p className="text-sm">
                    ${(fromAccount.balance - parseFloat(amount)).toFixed(2)}
                  </p>
                  <Badge variant="outline" className="mt-1">
                    Immediate
                  </Badge>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">Transfer immediately</p>
                <p className="text-blue-700 dark:text-blue-300">
                  This transfer will be processed instantly and the funds will
                  be available in your {toAccount.account_type} account right
                  away.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleConfirmTransfer} disabled={transferring}>
                {transferring ? 'Processing...' : 'Confirm Transfer'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Success */}
      {step === 3 && fromAccount && toAccount && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="bg-green-100 dark:bg-green-950 p-4 rounded-full">
                  <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-2">Transfer Complete!</h2>
                <p className="text-muted-foreground">
                  Your transfer was successful
                </p>
              </div>

              <div className="bg-muted p-6 rounded-lg space-y-3 max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-semibold">
                    ${parseFloat(amount).toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">From</span>
                  <span className="text-sm">
                    {fromAccount.account_type.charAt(0).toUpperCase() +
                      fromAccount.account_type.slice(1)}{' '}
                    ****{fromAccount.account_number.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">To</span>
                  <span className="text-sm">
                    {toAccount.account_type.charAt(0).toUpperCase() +
                      toAccount.account_type.slice(1)}{' '}
                    ****{toAccount.account_number.slice(-4)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(1);
                    setAmount('');
                    setMemo('');
                  }}
                >
                  Make Another Transfer
                </Button>
                <Button onClick={() => router.push('/dashboard')}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
