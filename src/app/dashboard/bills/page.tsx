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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Zap,
  Droplet,
  Wifi,
  CreditCard,
  Smartphone,
  Shield,
} from 'lucide-react';
import { useToast } from '@/components/ui/simple-toast';

type Account = {
  id: string;
  account_number: string;
  account_type: 'checking' | 'savings';
  balance: number;
};

const PAYEE_CATEGORIES = [
  { name: 'Electric Company', icon: Zap, category: 'utilities' },
  { name: 'Water & Sewer', icon: Droplet, category: 'utilities' },
  { name: 'Internet Provider', icon: Wifi, category: 'utilities' },
  { name: 'Credit Card', icon: CreditCard, category: 'credit' },
  { name: 'Phone Bill', icon: Smartphone, category: 'utilities' },
  { name: 'Insurance', icon: Shield, category: 'insurance' },
];

export default function BillsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const [fromAccountId, setFromAccountId] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [payeeCategory, setPayeeCategory] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [memo, setMemo] = useState('');

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

  const handleQuickSelect = (name: string, category: string) => {
    setPayeeName(name);
    setPayeeCategory(category);
  };

  const handleNextStep = () => {
    // Validation
    if (!fromAccountId || !payeeName || !amount) {
      toast({
        title: 'Validation error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
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

    if (fromAccount.balance < paymentAmount) {
      toast({
        title: 'Insufficient balance',
        description: `Your ${fromAccount.account_type} account has insufficient funds.`,
        variant: 'destructive',
      });
      return;
    }

    setStep(2);
  };

  const handleConfirmPayment = async () => {
    setPaying(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: 'Error',
          description: 'Please log in again.',
          variant: 'destructive',
        });
        setPaying(false);
        return;
      }

      if (!fromAccount) {
        setPaying(false);
        return;
      }

      // 1. Deduct from account
      const newBalance = fromAccount.balance - parseFloat(amount);

      const { error: balanceError } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', fromAccountId);

      if (balanceError) {
        console.error('Balance update error:', balanceError);
        toast({
          title: 'Payment failed',
          description: 'Could not update account balance.',
          variant: 'destructive',
        });
        setPaying(false);
        return;
      }

      // 2. Create transaction record
      const reference = `BILL-${Date.now()}`;
      const transactionData = {
        user_id: user.id,
        account_id: fromAccountId,
        transaction_type: 'payment',
        direction: 'debit',
        amount: parseFloat(amount),
        currency: 'USD',
        status: 'posted',
        description: `Bill payment to ${payeeName}`,
        reference: reference,
        balance_after: newBalance,
        metadata: {
          payee_name: payeeName,
          payee_category: payeeCategory,
          account_number: accountNumber,
          due_date: dueDate,
          memo: memo,
        },
      };

      console.log(
        '🔍 [BILLS] Creating transaction with data:',
        transactionData
      );
      console.log('🔍 [BILLS] User ID:', user.id);
      console.log('🔍 [BILLS] Account ID:', fromAccountId);
      console.log('🔍 [BILLS] Amount:', parseFloat(amount));
      console.log('🔍 [BILLS] Reference:', reference);

      const { data: insertData, error: txnError } = await supabase
        .from('transactions')
        .insert(transactionData);

      console.log('🔍 [BILLS] Transaction insert result:', {
        insertData,
        txnError,
      });

      if (txnError) {
        console.error('❌ [BILLS] Transaction error details:', txnError);
        console.error('❌ [BILLS] Error code:', txnError.code);
        console.error('❌ [BILLS] Error message:', txnError.message);
        console.error('❌ [BILLS] Error details:', txnError.details);
        console.error('❌ [BILLS] Error hint:', txnError.hint);
        console.error(
          '❌ [BILLS] Full error object:',
          JSON.stringify(txnError, null, 2)
        );

        toast({
          title: 'Payment failed',
          description: `Could not create transaction record: ${
            txnError.message || 'Unknown error'
          }`,
          variant: 'destructive',
        });
        setPaying(false);
        return;
      }

      console.log('✅ [BILLS] Transaction created successfully:', insertData);

      // 3. Send email confirmation
      try {
        const { data: bankUser } = await supabase
          .from('bank_users')
          .select('full_name, email')
          .eq('id', user.id)
          .single();

        if (bankUser?.email) {
          await fetch('/api/emails/bill-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: bankUser.email,
              userName: bankUser.full_name,
              amount: parseFloat(amount),
              payeeName: payeeName,
              reference: reference,
            }),
          });
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
        // Don't fail the payment if email fails
      }

      // 4. Create alert
      await supabase.from('alerts').insert({
        user_id: user.id,
        type: 'general',
        title: 'Bill payment processed',
        message: `$${parseFloat(amount).toFixed(
          2
        )} paid to ${payeeName}. Payment will be delivered in 1-2 business days.`,
        severity: 'success',
        is_read: false,
      });

      setStep(3);
      setPaying(false);
    } catch (err) {
      console.error('Payment error:', err);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
      setPaying(false);
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
        <h1 className="text-3xl font-bold tracking-tight">Pay Bills</h1>
        <p className="text-muted-foreground mt-2">
          Pay your bills quickly and securely
        </p>
      </div>

      {/* Progress indicator */}
      {step < 3 && (
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
            <div className="w-12 h-px bg-border"></div>
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
          </div>
        </div>
      )}

      {/* Quick Select Payees (only show in step 1) */}
      {step === 1 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Quick Select Payee</CardTitle>
            <CardDescription>
              Choose from common bill categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PAYEE_CATEGORIES.map((payee, index) => {
                const Icon = payee.icon;
                const isSelected = payeeName === payee.name;
                return (
                  <Button
                    key={index}
                    variant={isSelected ? 'default' : 'outline'}
                    className="h-auto py-4 flex-col gap-2"
                    onClick={() =>
                      handleQuickSelect(payee.name, payee.category)
                    }
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs text-center">{payee.name}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Form */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Bill Payment Details</CardTitle>
            <CardDescription>
              Enter payee and payment information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fromAccount">Pay From</Label>
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

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="payeeName">Payee Name</Label>
              <Input
                id="payeeName"
                placeholder="e.g., Electric Company"
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number (optional)</Label>
              <Input
                id="accountNumber"
                placeholder="Your account with payee"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                {fromAccount && (
                  <p className="text-sm text-muted-foreground">
                    Available: ${fromAccount.balance.toFixed(2)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date (optional)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="memo">Memo (optional)</Label>
              <Input
                id="memo"
                placeholder="Add a note about this payment"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Fee</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Processing Time</span>
                <Badge variant="outline">1-2 business days</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Method</span>
                <Badge variant="outline">Electronic</Badge>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Cancel
              </Button>
              <Button onClick={handleNextStep}>Continue</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Confirmation */}
      {step === 2 && fromAccount && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm Payment</CardTitle>
            <CardDescription>
              Please review the payment details carefully
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

              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Payee</span>
                <div className="text-right">
                  <p className="font-medium">{payeeName}</p>
                  {accountNumber && (
                    <p className="text-sm text-muted-foreground">
                      Acct: ****{accountNumber.slice(-4)}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount</span>
                <p className="text-2xl font-bold">
                  ${parseFloat(amount).toFixed(2)}
                </p>
              </div>

              {dueDate && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Due Date
                    </span>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </>
              )}

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
                  Processing Time
                </span>
                <Badge variant="outline">1-2 business days</Badge>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">Payment Delivery</p>
                <p className="text-blue-700 dark:text-blue-300">
                  Your payment will be electronically delivered to {payeeName}{' '}
                  within 1-2 business days.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleConfirmPayment} disabled={paying}>
                {paying ? 'Processing...' : 'Confirm Payment'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="bg-green-100 dark:bg-green-950 p-4 rounded-full">
                  <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-2">Payment Scheduled!</h2>
                <p className="text-muted-foreground">
                  Your bill payment is being processed
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
                  <span className="text-sm text-muted-foreground">Payee</span>
                  <span className="text-sm">{payeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Delivery Time
                  </span>
                  <Badge variant="outline">1-2 business days</Badge>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  You&apos;ll receive a confirmation once the payment is
                  delivered. Track the status in your transaction history.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(1);
                    setPayeeName('');
                    setPayeeCategory('');
                    setAccountNumber('');
                    setAmount('');
                    setDueDate('');
                    setMemo('');
                  }}
                >
                  Pay Another Bill
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
