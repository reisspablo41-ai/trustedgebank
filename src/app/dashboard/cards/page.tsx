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
import {
  Plus,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  CreditCard as CreditCardIcon,
  Wallet,
  Send,
  Snowflake,
  Settings2,
  Globe,
  Banknote,
  Nfc,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DashboardNav } from '@/components/dashboard-nav';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/simple-toast';

type BankCard = {
  id: string;
  card_number: string | null;
  card_type: 'debit' | 'credit' | 'prepaid';
  expiry_date: string | null;
  cvv: string | null;
  status: 'active' | 'frozen';
  online_purchases: boolean;
  atm_withdrawals: boolean;
  contactless: boolean;
  daily_limit: number;
};

/** Controls editable from the Manage dialog. */
type CardControls = Pick<
  BankCard,
  'online_purchases' | 'atm_withdrawals' | 'contactless' | 'daily_limit'
>;

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

/** Accessible on/off switch. The project has no Radix switch primitive. */
function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-primary' : 'bg-muted-foreground/30'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function CardsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<BankCard[]>([]);
  const [showCardNumbers, setShowCardNumbers] = useState<{
    [key: string]: boolean;
  }>({});
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedCardType, setSelectedCardType] = useState<
    'debit' | 'credit' | 'prepaid' | null
  >(null);
  const [requesting, setRequesting] = useState(false);

  // Freeze / manage state
  const [freezingId, setFreezingId] = useState<string | null>(null);
  const [managingCard, setManagingCard] = useState<BankCard | null>(null);
  const [draftControls, setDraftControls] = useState<CardControls | null>(null);
  const [savingControls, setSavingControls] = useState(false);

  useEffect(() => {
    loadCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCards = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    // Get access token
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      setLoading(false);
      return;
    }

    // Fetch cards from API
    try {
      const response = await fetch('/api/cards', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Cards fetched from API:', data);
        setCards(data.cards || []);
      } else {
        console.error('Error fetching cards:', response.statusText);
      }
    } catch (err) {
      console.error('Error loading cards:', err);
    }

    setLoading(false);
  };

  const maskCardNumber = (cardNumber: string | null, show: boolean) => {
    if (!cardNumber) return '**** **** **** ****';
    if (show) return cardNumber.match(/.{1,4}/g)?.join(' ') || cardNumber;
    return `**** **** **** ${cardNumber.slice(-4)}`;
  };

  const toggleCardNumber = (cardId: string) => {
    setShowCardNumbers((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  /** PATCH /api/cards and merge the returned row into local state. */
  const patchCard = async (
    cardId: string,
    changes: Partial<CardControls & { status: BankCard['status'] }>
  ): Promise<BankCard | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      router.replace('/auth/login');
      return null;
    }

    const response = await fetch('/api/cards', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ card_id: cardId, ...changes }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Request failed');
    }

    const { card } = await response.json();
    setCards((prev) => prev.map((c) => (c.id === card.id ? card : c)));
    return card as BankCard;
  };

  const handleToggleFreeze = async (card: BankCard) => {
    const nextStatus = card.status === 'frozen' ? 'active' : 'frozen';
    setFreezingId(card.id);

    try {
      await patchCard(card.id, { status: nextStatus });
      toast({
        title: nextStatus === 'frozen' ? 'Card frozen' : 'Card unfrozen',
        description:
          nextStatus === 'frozen'
            ? 'New transactions on this card will be declined until you unfreeze it.'
            : 'This card can be used for transactions again.',
      });
    } catch (err) {
      toast({
        title: 'Could not update card',
        description:
          err instanceof Error ? err.message : 'Please try again shortly.',
        variant: 'destructive',
      });
    } finally {
      setFreezingId(null);
    }
  };

  const openManageDialog = (card: BankCard) => {
    setManagingCard(card);
    setDraftControls({
      online_purchases: card.online_purchases,
      atm_withdrawals: card.atm_withdrawals,
      contactless: card.contactless,
      daily_limit: card.daily_limit,
    });
  };

  const closeManageDialog = () => {
    setManagingCard(null);
    setDraftControls(null);
  };

  const handleSaveControls = async () => {
    if (!managingCard || !draftControls) return;

    setSavingControls(true);
    try {
      await patchCard(managingCard.id, draftControls);
      toast({
        title: 'Card settings saved',
        description: 'Your card controls have been updated.',
      });
      closeManageDialog();
    } catch (err) {
      toast({
        title: 'Could not save settings',
        description:
          err instanceof Error ? err.message : 'Please try again shortly.',
        variant: 'destructive',
      });
    } finally {
      setSavingControls(false);
    }
  };

  const handleRequestCard = async () => {
    if (!selectedCardType) return;

    setRequesting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: 'Error',
          description: 'Please log in to request a card.',
          variant: 'destructive',
        });
        setRequesting(false);
        return;
      }

      // Get access token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        setRequesting(false);
        return;
      }

      // Create card via API
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          card_type: selectedCardType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Card creation error:', errorData);
        toast({
          title: 'Request failed',
          description:
            errorData.error || 'Could not create card. Please try again.',
          variant: 'destructive',
        });
      } else {
        const data = await response.json();
        console.log('Card created:', data.card);

        toast({
          title: 'Card created successfully',
          description: `Your physical ${selectedCardType} card has been created and will be shipped within 5-7 business days.`,
        });

        setRequestDialogOpen(false);
        setSelectedCardType(null);

        // Reload cards to show new card
        await loadCards();
      }
    } catch (err) {
      console.error('Request error:', err);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRequesting(false);
    }
  };

  const primaryCard = cards[0] ?? null;

  if (loading) {
    return (
      <>
        <DashboardNav />
        <div className="mx-auto w-full max-w-7xl px-6 py-8 md:py-12">
          <div className="mb-8">
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-48 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardNav />
      <div className="mx-auto w-full max-w-7xl px-6 py-8 md:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              My Cards
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your debit and credit cards
            </p>
          </div>
          <Button onClick={() => setRequestDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Request New Card
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            // Teal gradient colors based on card type
            let gradientClass = '';
            if (card.card_type === 'prepaid') {
              gradientClass = 'bg-gradient-to-br from-teal-600 to-teal-700';
            } else if (card.card_type === 'debit') {
              gradientClass = 'bg-gradient-to-br from-teal-700 to-teal-800';
            } else if (card.card_type === 'credit') {
              gradientClass = 'bg-gradient-to-br from-teal-800 to-teal-900';
            }

            const isFrozen = card.status === 'frozen';

            return (
              <Card
                key={card.id}
                className={`relative overflow-hidden ${gradientClass} text-white transition-all ${
                  isFrozen ? 'saturate-50 opacity-80' : ''
                }`}
              >
                {isFrozen && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-10 bg-sky-950/35 backdrop-blur-[1px]"
                  />
                )}
                <CardHeader className="relative z-20">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {/* Trust Edge Logo */}
                      <div className="h-8 w-8 rounded bg-white/20 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/trust-edge-logo.svg"
                          alt=""
                          className="h-6 w-6"
                        />
                      </div>
                      <div>
                        <CardTitle className="text-white text-sm capitalize">
                          {card.card_type} Card
                        </CardTitle>
                        <CardDescription className="text-white/80 text-xs mt-1">
                          Trust Edge Bank
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant="default"
                      className={
                        isFrozen
                          ? 'bg-sky-100 text-sky-900 border-sky-200'
                          : 'bg-white/20 text-white border-white/30'
                      }
                    >
                      {isFrozen ? (
                        <>
                          <Snowflake className="mr-1 h-3 w-3" />
                          Frozen
                        </>
                      ) : (
                        'Active'
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative z-20 space-y-6">
                  {/* Card Number */}
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-mono tracking-wider">
                      {maskCardNumber(
                        card.card_number,
                        showCardNumbers[card.id]
                      )}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10"
                      onClick={() => toggleCardNumber(card.id)}
                    >
                      {showCardNumbers[card.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Expiry & CVV */}
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-white/70 text-xs">Valid Thru</p>
                      <p className="font-medium">
                        {card.expiry_date || '--/--'}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/70 text-xs">CVV</p>
                      <p className="font-medium font-mono">
                        {showCardNumbers[card.id] ? card.cvv || '***' : '***'}
                      </p>
                    </div>
                  </div>

                  <Separator className="bg-white/20" />

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={freezingId === card.id}
                      onClick={() => handleToggleFreeze(card)}
                      className="flex-1 bg-white/20 text-white hover:bg-white/30 border-white/30"
                    >
                      {freezingId === card.id ? (
                        'Updating…'
                      ) : isFrozen ? (
                        <>
                          <Unlock className="mr-2 h-3 w-3" />
                          Unfreeze
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-3 w-3" />
                          Freeze
                        </>
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openManageDialog(card)}
                      className="flex-1 bg-white/20 text-white hover:bg-white/30 border-white/30"
                    >
                      <Settings2 className="mr-2 h-3 w-3" />
                      Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Add New Card */}
          <button onClick={() => setRequestDialogOpen(true)} className="w-full">
            <Card className="border-dashed border-2 hover:border-primary hover:bg-accent cursor-pointer transition-colors h-full">
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[280px] text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Request New Card</h3>
                <p className="text-sm text-muted-foreground">
                  Add a new debit, credit, or prepaid card
                </p>
              </CardContent>
            </Card>
          </button>
        </div>

        {/* Card Management Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Card Controls</CardTitle>
              <CardDescription>
                {primaryCard
                  ? `Current settings for your ${primaryCard.card_type} card`
                  : 'Manage card settings'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {primaryCard ? (
                <div className="space-y-3 text-sm">
                  {(
                    [
                      ['Online Purchases', primaryCard.online_purchases],
                      ['ATM Withdrawals', primaryCard.atm_withdrawals],
                      ['Contactless', primaryCard.contactless],
                    ] as const
                  ).map(([label, enabled], i) => (
                    <div key={label}>
                      {i > 0 && <Separator className="mb-3" />}
                      <div className="flex items-center justify-between">
                        <span>{label}</span>
                        <Badge variant={enabled ? 'default' : 'secondary'}>
                          {enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <Separator />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => openManageDialog(primaryCard)}
                  >
                    <Settings2 className="mr-2 h-3 w-3" />
                    Manage this card
                  </Button>
                </div>
              ) : (
                <p className="py-4 text-sm text-muted-foreground">
                  Request a card to configure its controls.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Spending Limits</CardTitle>
              <CardDescription>Daily transaction limits</CardDescription>
            </CardHeader>
            <CardContent>
              {primaryCard ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground">Daily Limit</span>
                      <span className="font-medium">
                        {currency.format(primaryCard.daily_limit)}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: '0%' }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      $0.00 spent today
                    </p>
                  </div>
                </div>
              ) : (
                <p className="py-4 text-sm text-muted-foreground">
                  No cards yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Latest card transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground py-4">
                No card transactions yet. Start using your card!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Manage Card Dialog */}
      <Dialog
        open={managingCard !== null}
        onOpenChange={(open) => !open && closeManageDialog()}
      >
        <DialogContent onClose={closeManageDialog}>
          <DialogHeader>
            <DialogTitle className="capitalize">
              Manage {managingCard?.card_type} card
            </DialogTitle>
            <DialogDescription>
              {managingCard?.card_number
                ? `Ending in ${managingCard.card_number.slice(-4)}`
                : 'Card controls and spending limit'}
            </DialogDescription>
          </DialogHeader>

          {managingCard && draftControls && (
            <div className="space-y-5 py-4">
              {/* Freeze state, mirrored here so the dialog is self-contained */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30">
                    <Snowflake className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Freeze card</p>
                    <p className="text-xs text-muted-foreground">
                      Temporarily decline all new transactions.
                    </p>
                  </div>
                </div>
                <Toggle
                  label="Freeze card"
                  checked={managingCard.status === 'frozen'}
                  disabled={freezingId === managingCard.id}
                  onChange={async () => {
                    await handleToggleFreeze(managingCard);
                    setManagingCard((prev) =>
                      prev
                        ? {
                            ...prev,
                            status:
                              prev.status === 'frozen' ? 'active' : 'frozen',
                          }
                        : prev
                    );
                  }}
                />
              </div>

              <Separator />

              {/* Card controls */}
              <div className="space-y-4">
                {(
                  [
                    {
                      key: 'online_purchases',
                      icon: Globe,
                      title: 'Online purchases',
                      desc: 'Allow this card for e-commerce and in-app payments.',
                    },
                    {
                      key: 'atm_withdrawals',
                      icon: Banknote,
                      title: 'ATM withdrawals',
                      desc: 'Allow cash withdrawals at ATMs.',
                    },
                    {
                      key: 'contactless',
                      icon: Nfc,
                      title: 'Contactless',
                      desc: 'Allow tap-to-pay at terminals.',
                    },
                  ] as const
                ).map(({ key, icon: Icon, title, desc }) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{title}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                    <Toggle
                      label={title}
                      checked={draftControls[key]}
                      onChange={(next) =>
                        setDraftControls((prev) =>
                          prev ? { ...prev, [key]: next } : prev
                        )
                      }
                    />
                  </div>
                ))}
              </div>

              <Separator />

              {/* Daily limit */}
              <div className="space-y-2">
                <Label htmlFor="daily-limit">Daily spending limit</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="daily-limit"
                    type="number"
                    min={0}
                    step={100}
                    className="pl-7"
                    value={draftControls.daily_limit}
                    onChange={(e) =>
                      setDraftControls((prev) =>
                        prev
                          ? { ...prev, daily_limit: Number(e.target.value) }
                          : prev
                      )
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Transactions above this amount in a single day will be
                  declined.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeManageDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveControls} disabled={savingControls}>
              {savingControls ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Physical Card Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent onClose={() => setRequestDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Request Physical Card</DialogTitle>
            <DialogDescription>
              Choose the type of physical card you&apos;d like to receive
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-3">
            {/* Debit Card Option */}
            <button
              onClick={() => setSelectedCardType('debit')}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                selectedCardType === 'debit'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                  <CreditCardIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Physical Debit Card</h3>
                  <p className="text-sm text-muted-foreground">
                    Use for everyday purchases and ATM withdrawals. Free
                    shipping.
                  </p>
                </div>
              </div>
            </button>

            {/* Credit Card Option */}
            <button
              onClick={() => setSelectedCardType('credit')}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                selectedCardType === 'credit'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                  <CreditCardIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Physical Credit Card</h3>
                  <p className="text-sm text-muted-foreground">
                    Build credit and earn rewards. Subject to approval.
                  </p>
                </div>
              </div>
            </button>

            {/* Prepaid Card Option */}
            <button
              onClick={() => setSelectedCardType('prepaid')}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                selectedCardType === 'prepaid'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                  <Wallet className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Physical Prepaid Card</h3>
                  <p className="text-sm text-muted-foreground">
                    Load funds in advance. Perfect for budgeting and gifts.
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="bg-muted rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <Send className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Shipping Information</p>
                <p className="text-muted-foreground">
                  Your physical card will be shipped to your registered address.
                  Delivery takes 5-7 business days.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRequestDialogOpen(false);
                setSelectedCardType(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestCard}
              disabled={!selectedCardType || requesting}
            >
              {requesting ? 'Requesting...' : 'Request Card'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
