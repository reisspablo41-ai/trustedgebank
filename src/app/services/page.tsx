'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PiggyBank,
  CreditCard,
  ArrowLeftRight,
  Banknote,
  Landmark,
  Wallet,
} from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';

export default function ServicesPage() {
  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        <section>
          <Badge className="mb-4">Our Products</Badge>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Banking that works for you
          </h1>
          <p className="mt-4 text-muted-foreground max-w-prose">
            Clear, powerful products for everyday money management and long-term
            goals.
          </p>
        </section>

        <section className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" /> Checking Accounts
              </CardTitle>
              <CardDescription>
                No monthly fees, instant notifications, and modern cards.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 text-sm">
              Direct deposit, budgeting tools, and real-time controls.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-primary" /> Savings Accounts
              </CardTitle>
              <CardDescription>
                High-yield savings to grow your money faster.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 text-sm">
              Automatic round-ups, goals, and insights to keep you on track.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Banknote className="h-5 w-5 text-primary" /> Loans & Mortgages
              </CardTitle>
              <CardDescription>
                Fair terms, fast decisions, and transparent pricing.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 text-sm">
              Flexible repayments and no hidden fees.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-primary" /> Transfers &
                Payments
              </CardTitle>
              <CardDescription>
                Send and receive money in seconds, locally and abroad.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 text-sm">
              International support with competitive FX rates.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> Cards
              </CardTitle>
              <CardDescription>
                Virtual and physical cards with powerful controls.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 text-sm">
              Spending limits, category locks, and instant freeze/unfreeze.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary" /> Business Banking
              </CardTitle>
              <CardDescription>
                Accounts and tools built for growing companies.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 text-sm">
              Multi-user access, approvals, and accounting integrations.
            </CardContent>
          </Card>
        </section>
      </div>
    </PageTransition>
  );
}
