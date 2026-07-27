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

export default function LearnMorePage() {
  return (
    <PageTransition>
    <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
      <section>
        <Badge className="mb-4">Learn more</Badge>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Banking reinvented for you
        </h1>
        <p className="mt-4 text-muted-foreground max-w-prose">
          We designed Trust Edge Bank to be clear, fast, and trustworthy from day
          one. Here’s how we deliver better everyday banking.
        </p>
      </section>

      <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transparent pricing</CardTitle>
            <CardDescription>No surprises</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-sm">
            Our fees are clear and simple. No monthly maintenance fees, ever.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fast support</CardTitle>
            <CardDescription>24/7 coverage</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-sm">
            Get help any time via chat, phone, or email. We’re here when you
            need us.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Modern security</CardTitle>
            <CardDescription>Peace of mind</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-sm">
            Biometrics, alerts, and encrypted infrastructure keep your data
            safe.
          </CardContent>
        </Card>
      </section>
    </div>
    </PageTransition>
  );
}
