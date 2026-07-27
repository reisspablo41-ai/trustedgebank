'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageTransition } from '@/components/PageTransition';

export default function LoanRatesPage() {
  return (
    <PageTransition>
    <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
      <section>
        <Badge className="mb-4">Loans</Badge>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Fair rates. Clear terms.
        </h1>
        <p className="mt-4 text-muted-foreground max-w-prose">
          We believe borrowing should be simple and fair. Here’s how our
          personal loan rates and terms work, with examples to help you decide.
        </p>
      </section>

      <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fixed APR</CardTitle>
            <CardDescription>Predictable payments</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-sm">
            Competitive fixed APR that never changes during the life of your
            loan.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No hidden fees</CardTitle>
            <CardDescription>Transparent pricing</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-sm">
            No origination or prepayment penalties. Pay off early anytime.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Flexible terms</CardTitle>
            <CardDescription>Choose what fits</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-sm">
            Loan terms from 12–60 months with clear monthly payment examples.
          </CardContent>
        </Card>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Example scenarios</CardTitle>
            <CardDescription>
              Illustrative estimates (not offers)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground space-y-4">
            <p>
              <strong>$10,000</strong> over <strong>36 months</strong> at{' '}
              <strong>8.49% APR</strong>: estimated monthly payment of{' '}
              <strong>$316</strong>; total interest approximately{' '}
              <strong>$1,376</strong>.
            </p>
            <p>
              <strong>$20,000</strong> over <strong>48 months</strong> at{' '}
              <strong>9.25% APR</strong>: estimated monthly payment of{' '}
              <strong>$503</strong>; total interest approximately{' '}
              <strong>$4,144</strong>.
            </p>
            <p>
              Actual rates depend on creditworthiness and other factors. Subject
              to approval. Terms may change.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
    </PageTransition>
  );
}
