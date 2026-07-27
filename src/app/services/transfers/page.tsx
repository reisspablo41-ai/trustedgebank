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

export default function TransfersPage() {
  return (
    <PageTransition>
    <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
      <section>
        <Badge className="mb-4">Transfers</Badge>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Move money instantly
        </h1>
        <p className="mt-4 text-muted-foreground max-w-prose">
          Whether you’re splitting a bill or paying an invoice, Trust Edge transfers
          are fast, transparent, and reliable.
        </p>
      </section>

      <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Domestic</CardTitle>
            <CardDescription>Seconds, not days</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-sm">
            Send money to friends and businesses instantly with clear status
            updates and notifications.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">International</CardTitle>
            <CardDescription>Great FX rates</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-sm">
            Transfer abroad with competitive foreign exchange and transparent
            fees before you send.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Safety</CardTitle>
            <CardDescription>Protected end to end</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-sm">
            Fraud checks, authentication, and real-time alerts help keep
            transfers secure.
          </CardContent>
        </Card>
      </section>
    </div>
    </PageTransition>
  );
}
