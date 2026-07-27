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
import { ArrowLeft, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { useToast } from '@/components/ui/simple-toast';

type Account = {
  id: string;
  account_number: string;
  account_type: 'checking' | 'savings';
  balance: number;
};

const US_BANKS = [
  'JPMorgan Chase Bank',
  'Bank of America',
  'Wells Fargo Bank',
  'Citibank',
  'U.S. Bank',
  'PNC Bank',
  'Truist Bank',
  'Goldman Sachs Bank USA',
  'Capital One Bank',
  'TD Bank',
  'Fifth Third Bank',
  'Citizens Bank',
  'HSBC Bank USA',
  'KeyBank',
  'Regions Bank',
  'Huntington National Bank',
  'BMO Bank',
  'Ally Bank',
  'American Express National Bank',
  'Navy Federal Credit Union',
  'USAA Federal Savings Bank',
  'Discover Bank',
  'Charles Schwab Bank',
  'Comerica Bank',
  'First Citizens Bank',
  'M&T Bank',
  'Synchrony Bank',
  'Barclays Bank Delaware',
  'SoFi Bank',
  'Axos Bank',
  'Chime',
  'Varo Bank',
  'Brex Cash',
  'Western Alliance Bank',
  'Zions Bank',
  'Frost Bank',
  'Associated Bank',
  'First Hawaiian Bank',
  'City National Bank',
  'Old National Bank',
  'Webster Bank',
  'Valley National Bank',
  'East West Bank',
  'Glacier Bank',
  'FirstBank',
  'Banner Bank',
  'Cadence Bank',
  'Simmons Bank',
  'Columbia Bank',
  'Texas Capital Bank',
  'Bank OZK',
  'Pacific Western Bank',
  'First Interstate Bank',
  'SouthState Bank',
  'Hancock Whitney Bank',
  'Customers Bank',
  'Pinnacle Bank',
  'United Bank',
  'Ameris Bank',
  'BOK Financial',
  'Wintrust Bank',
  'First Horizon Bank',
  'TowneBank',
  'Arvest Bank',
  'Bank of Hawaii',
  'Cathay Bank',
  'IncredibleBank',
];

export default function SendMoneyPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [fromAccountId, setFromAccountId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [bankName, setBankName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');

  const [step, setStep] = useState(1); // 1: Form, 2: Confirmation, 3: Success
  const [searchBank, setSearchBank] = useState('');
  const [showBankList, setShowBankList] = useState(false);

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

  const filteredBanks = US_BANKS.filter((bank) =>
    bank.toLowerCase().includes(searchBank.toLowerCase())
  );

  const handleBankSelect = (bank: string) => {
    setBankName(bank);
    setShowBankList(false);
    setSearchBank('');
  };

  const handleNextStep = () => {
    // Validation
    if (
      !fromAccountId ||
      !recipientName ||
      !bankName ||
      !routingNumber ||
      !accountNumber ||
      !amount
    ) {
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

    // Validate routing number (9 digits)
    if (!/^\d{9}$/.test(routingNumber)) {
      toast({
        title: 'Invalid routing number',
        description: 'Routing number must be exactly 9 digits.',
        variant: 'destructive',
      });
      return;
    }

    // Validate account number (4-17 digits)
    if (!/^\d{4,17}$/.test(accountNumber)) {
      toast({
        title: 'Invalid account number',
        description: 'Account number must be between 4-17 digits.',
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

  const handleConfirmSend = async () => {
    setSending(true);

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
        setSending(false);
        return;
      }

      // 1. Deduct from sender account
      if (!fromAccount) {
        setSending(false);
        return;
      }

      const newBalance = fromAccount.balance - parseFloat(amount);

      const { error: balanceError } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', fromAccountId);

      if (balanceError) {
        console.error('Balance update error:', balanceError);
        toast({
          title: 'Transfer failed',
          description: 'Could not update account balance.',
          variant: 'destructive',
        });
        setSending(false);
        return;
      }

      // 2. Create transaction record
      const transactionData = {
        user_id: user.id,
        account_id: fromAccountId,
        transaction_type: 'transfer',
        direction: 'debit',
        amount: parseFloat(amount),
        currency: 'USD',
        status: 'posted',
        description: `Sent to ${recipientName} at ${bankName}`,
        reference: `EXT-${Date.now()}`,
        metadata: {
          recipient_name: recipientName,
          bank_name: bankName,
          routing_number: routingNumber,
          account_number_masked: `****${accountNumber.slice(-4)}`,
          memo: memo,
        },
      };

      console.log(
        '🔍 [SEND MONEY] Creating transaction with data:',
        transactionData
      );
      console.log('🔍 [SEND MONEY] User ID:', user.id);
      console.log('🔍 [SEND MONEY] Account ID:', fromAccountId);
      console.log('🔍 [SEND MONEY] Amount:', parseFloat(amount));
      console.log('🔍 [SEND MONEY] Reference:', `EXT-${Date.now()}`);

      const { data: insertData, error: txnError } = await supabase
        .from('transactions')
        .insert(transactionData);

      console.log('🔍 [SEND MONEY] Transaction insert result:', {
        insertData,
        txnError,
      });

      if (txnError) {
        console.error('❌ [SEND MONEY] Transaction error details:', txnError);
        console.error('❌ [SEND MONEY] Error code:', txnError.code);
        console.error('❌ [SEND MONEY] Error message:', txnError.message);
        console.error('❌ [SEND MONEY] Error details:', txnError.details);
        console.error('❌ [SEND MONEY] Error hint:', txnError.hint);
        console.error(
          '❌ [SEND MONEY] Full error object:',
          JSON.stringify(txnError, null, 2)
        );

        toast({
          title: 'Transfer failed',
          description: `Could not create transaction record: ${
            txnError.message || 'Unknown error'
          }`,
          variant: 'destructive',
        });
        setSending(false);
        return;
      }

      console.log(
        '✅ [SEND MONEY] Transaction created successfully:',
        insertData
      );

      // 3. Create alert
      await supabase.from('alerts').insert({
        user_id: user.id,
        type: 'general',
        title: 'Money sent',
        message: `$${parseFloat(amount).toFixed(
          2
        )} sent to ${recipientName} at ${bankName}. Processing time: 1-3 business days.`,
        severity: 'success',
        is_read: false,
      });

      setStep(3);
      setSending(false);
    } catch (err) {
      console.error('Send error:', err);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
      setSending(false);
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
        <h1 className="text-3xl font-bold tracking-tight">Send Money</h1>
        <p className="text-muted-foreground mt-2">
          Send money to any U.S. bank account
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

      {/* Step 1: Form */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Recipient Details</CardTitle>
            <CardDescription>
              Enter the recipient&apos;s banking information
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

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="recipientName">Recipient Name</Label>
              <Input
                id="recipientName"
                placeholder="John Doe"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <div className="relative">
                <Input
                  id="bankName"
                  placeholder="Search for a bank..."
                  value={bankName || searchBank}
                  onChange={(e) => {
                    setSearchBank(e.target.value);
                    setBankName('');
                    setShowBankList(true);
                  }}
                  onFocus={() => setShowBankList(true)}
                />
                <Search className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />

                {showBankList && searchBank && filteredBanks.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredBanks.slice(0, 10).map((bank, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-muted text-sm"
                        onClick={() => handleBankSelect(bank)}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {bankName && (
                <p className="text-sm text-muted-foreground">
                  Selected: {bankName}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="routingNumber">Routing Number</Label>
                <Input
                  id="routingNumber"
                  placeholder="123456789"
                  maxLength={9}
                  value={routingNumber}
                  onChange={(e) =>
                    setRoutingNumber(e.target.value.replace(/\D/g, ''))
                  }
                />
                <p className="text-xs text-muted-foreground">9 digits</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  placeholder="Account number"
                  maxLength={17}
                  value={accountNumber}
                  onChange={(e) =>
                    setAccountNumber(e.target.value.replace(/\D/g, ''))
                  }
                />
                <p className="text-xs text-muted-foreground">4-17 digits</p>
              </div>
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
              {fromAccount && (
                <p className="text-sm text-muted-foreground">
                  Available: ${fromAccount.balance.toFixed(2)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="memo">Memo (optional)</Label>
              <Input
                id="memo"
                placeholder="What's this for?"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">Processing Time</p>
                <p className="text-blue-700 dark:text-blue-300">
                  External bank transfers typically take 1-3 business days to
                  process.
                </p>
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
            <CardTitle>Confirm Transfer</CardTitle>
            <CardDescription>
              Please review the transfer details carefully
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
                <span className="text-sm text-muted-foreground">To</span>
                <div className="text-right">
                  <p className="font-medium">{recipientName}</p>
                  <p className="text-sm text-muted-foreground">{bankName}</p>
                  <p className="text-sm text-muted-foreground">
                    ****{accountNumber.slice(-4)}
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
                  Processing Time
                </span>
                <Badge variant="outline">1-3 business days</Badge>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-900 dark:text-amber-100">
                <p className="font-medium mb-1">Important</p>
                <p className="text-amber-700 dark:text-amber-300">
                  Please verify all details are correct. This transfer cannot be
                  cancelled once confirmed.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleConfirmSend} disabled={sending}>
                {sending ? 'Processing...' : 'Confirm & Send'}
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
                <h2 className="text-2xl font-bold mb-2">Transfer Initiated!</h2>
                <p className="text-muted-foreground">
                  Your money is on its way
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
                  <span className="text-sm text-muted-foreground">To</span>
                  <span className="text-sm">{recipientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Bank</span>
                  <span className="text-sm">{bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Est. Arrival
                  </span>
                  <Badge variant="outline">1-3 business days</Badge>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  You&apos;ll receive a notification when the transfer is
                  complete. You can check the status in your transaction
                  history.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(1);
                    setRecipientName('');
                    setBankName('');
                    setRoutingNumber('');
                    setAccountNumber('');
                    setAmount('');
                    setMemo('');
                  }}
                >
                  Send to Another Person
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
