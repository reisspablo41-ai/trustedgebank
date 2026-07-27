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

export default function StorySmallBusinessPage() {
  return (
    <PageTransition>
    <div className="mx-auto w-full max-w-3xl px-6 py-16 md:py-20">
      <Badge className="mb-4">Customer story</Badge>
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
        Growing a small business with Trust Edge
      </h1>
      <p className="mt-4 text-muted-foreground">
        How Park & Co. used Trust Edge business banking to streamline operations,
        improve cash flow, and focus on customers.
      </p>

      {/* Hero Image */}
      <div className="mt-8 aspect-video w-full rounded-lg border bg-muted overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sofia.jpg"
          alt="Sofia Park"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="mt-8 space-y-6 text-sm leading-7 text-muted-foreground">
        <p>
          When Sofia Park launched Park & Co., a neighborhood design studio, she
          needed a bank that could keep up with the pace of a growing client
          base. Traditional tools felt slow and fragmented. Trust Edge offered a
          clean dashboard, instant transfers, and multi-user access—features
          that mapped to the way her team worked.
        </p>
        <p>
          Moving invoices and vendor payments into Trust Edge reduced hours of
          bookkeeping each week. Sofia set spending limits on team cards,
          created virtual cards for online purchases, and approved payments from
          her phone during site visits. Real-time alerts and reliable transfers
          meant less time worrying about logistics and more time serving
          clients.
        </p>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outcomes</CardTitle>
            <CardDescription>Measurable improvements</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="list-disc pl-4 space-y-2">
              <li>Saved ~6 hours per week on reconciliation</li>
              <li>Reduced payment delays by 40% with instant transfers</li>
              <li>Improved budget accuracy with category-level controls</li>
            </ul>
          </CardContent>
        </Card>
        <p>
          “I can train a new teammate in minutes,” Sofia explains. “The controls
          are intuitive and the alerts catch issues before they become
          problems.” With less administrative overhead, Park & Co. expanded
          services and took on larger projects, confident the bank wouldn’t be a
          bottleneck.
        </p>
        <p>
          Today, Park & Co. continues to grow with Trust Edge. The team relies on
          fast support and industry-grade security, while clients enjoy quicker
          turnarounds thanks to streamlined finances. For Sofia, the biggest win
          is focus: “Trust Edge lets us spend time on the work that matters.”
        </p>
      </div>
    </div>
    </PageTransition>
  );
}
