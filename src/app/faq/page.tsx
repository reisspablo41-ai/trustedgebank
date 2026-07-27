'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/PageTransition';

export default function FaqPage() {
  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-3xl px-6 py-16 md:py-20">
        <section>
          <Badge className="mb-4">FAQ</Badge>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            How can we help?
          </h1>
          <p className="mt-4 text-muted-foreground">
            Quick answers to common questions.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Account setup & management</h2>
          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="acct-1">
              <AccordionTrigger>How do I open an account?</AccordionTrigger>
              <AccordionContent>
                Download the Trust Edge app or start online. Verification typically
                takes a few minutes with a valid ID.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="acct-2">
              <AccordionTrigger>
                Do you charge monthly maintenance fees?
              </AccordionTrigger>
              <AccordionContent>
                No. Our checking and savings accounts have no monthly fees.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Refunds and withdrawals</h2>
          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="refund-1">
              <AccordionTrigger>How long do refunds take?</AccordionTrigger>
              <AccordionContent>
                Refunds usually post within 3–5 business days depending on the
                merchant and network.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="refund-2">
              <AccordionTrigger>What withdrawal limits apply?</AccordionTrigger>
              <AccordionContent>
                Limits vary by account standing. See your app for personalized
                limits, or contact support to request changes.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Security tips</h2>
          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="sec-1">
              <AccordionTrigger>
                How do I keep my account secure?
              </AccordionTrigger>
              <AccordionContent>
                Use a strong unique password, enable biometrics, and never share
                one-time codes. We will never ask for your password.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="sec-2">
              <AccordionTrigger>
                What should I do if I suspect fraud?
              </AccordionTrigger>
              <AccordionContent>
                Freeze your card in the app immediately and contact support. We
                will investigate and help you secure your account.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Fees and charges</h2>
          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="fee-1">
              <AccordionTrigger>Are there ATM fees?</AccordionTrigger>
              <AccordionContent>
                We reimburse out-of-network ATM fees up to a monthly limit. See
                your account details.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="fee-2">
              <AccordionTrigger>
                Do you charge foreign transaction fees?
              </AccordionTrigger>
              <AccordionContent>
                No foreign transaction fees on card purchases. Competitive FX
                rates apply to international transfers.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </PageTransition>
  );
}
