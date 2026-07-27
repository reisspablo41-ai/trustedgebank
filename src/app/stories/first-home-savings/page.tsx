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

export default function StoryFirstHomePage() {
  return (
    <PageTransition>
    <div className="mx-auto w-full max-w-3xl px-6 py-16 md:py-20">
      <Badge className="mb-4">Customer story</Badge>
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
        Saving for a first home
      </h1>
      <p className="mt-4 text-muted-foreground">
        How Anthony used Trust Edge automated savings, goals, and insights to build
        a down payment faster than expected.
      </p>

      {/* Hero Image */}
      <div className="mt-8 aspect-video w-full rounded-lg border bg-muted overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/rivera.jpg"
          alt="Anthony Rivera"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="mt-8 space-y-6 text-sm leading-7 text-muted-foreground">
        <p>
          Anthony always considered homeownership out of reach. After switching
          to Trust Edge, he set a savings goal with a target date and enabled
          round-ups and automated contributions each payday. The experience was
          simple: clear progress indicators, helpful reminders, and no hidden
          fees.
        </p>
        <p>
          With insights that highlighted discretionary spending, Anthony made
          small changes that compounded. He re-allocated monthly budgets, and
          the app visualized the impact on his goal timeline. Seeing the
          estimated time to target drop each month kept motivation high.
        </p>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What worked</CardTitle>
            <CardDescription>Small habits, big results</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="list-disc pl-4 space-y-2">
              <li>Automated transfers after each paycheck</li>
              <li>Round-ups on everyday purchases</li>
              <li>Category insights that identified quick wins</li>
            </ul>
          </CardContent>
        </Card>
        <p>
          Within eighteen months, Anthony hit his down payment goal. “The
          biggest difference was clarity,” he says. “Trust Edge showed me exactly
          how my choices moved the timeline.” With savings on track and a strong
          habit in place, he closed on his first home—weeks earlier than
          planned.
        </p>
        <p>
          Today, he continues using Trust Edge to manage emergency savings and track
          future goals, confident that the same tools will help him plan the
          next chapter.
        </p>
      </div>
    </div>
    </PageTransition>
  );
}
