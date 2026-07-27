'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/PageTransition';

export default function CompareAccountsPage() {
  return (
    <PageTransition>
    <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
      <section>
        <Badge className="mb-4">Accounts</Badge>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Find the right account
        </h1>
        <p className="mt-4 text-muted-foreground max-w-prose">
          Compare features and choose the account that matches your needs.
        </p>
      </section>

      <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Everyday Checking</CardTitle>
            <CardDescription>Zero monthly fees</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-sm">
            <ul className="list-disc pl-4 space-y-2">
              <li>Instant debit card controls</li>
              <li>Direct deposit and bill pay</li>
              <li>Budgeting and insights</li>
            </ul>
            <div className="mt-4">
              <Button asChild size="sm">
                <a href="/open-account">Open checking</a>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">High-Yield Savings</CardTitle>
            <CardDescription>Competitive APY</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-sm">
            <ul className="list-disc pl-4 space-y-2">
              <li>No monthly fees</li>
              <li>Automated round-ups and goals</li>
              <li>Transfer instantly to checking</li>
            </ul>
            <div className="mt-4">
              <Button asChild size="sm" variant="outline">
                <a href="/open-account">Open savings</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
    </PageTransition>
  );
}
