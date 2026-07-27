'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/PageTransition';

const openings = [
  {
    title: 'Software Engineer, Frontend',
    location: 'Remote (US/EU)',
    type: 'Full-time',
  },
  {
    title: 'Product Manager, Payments',
    location: 'New York, NY',
    type: 'Full-time',
  },
  { title: 'Risk Analyst', location: 'Remote (US)', type: 'Full-time' },
];

export default function CareersPage() {
  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        <section>
          <Badge className="mb-4">Careers</Badge>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Do your best work with us
          </h1>
          <p className="mt-4 text-muted-foreground max-w-prose">
            We are a diverse, remote-friendly team building trustworthy
            financial products for millions.
          </p>
        </section>

        <section className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Our culture</CardTitle>
              <CardDescription>
                Principles that guide how we work
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 text-sm">
              We value ownership, candor, and craftsmanship. We move
              thoughtfully and build for the long term.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Benefits</CardTitle>
              <CardDescription>Support to do your best work</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 text-sm">
              Competitive compensation, equity, flexible PTO, and comprehensive
              health coverage.
            </CardContent>
          </Card>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight">
            Open positions
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4">
            {openings.map((job) => (
              <Card key={job.title} className="">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{job.title}</CardTitle>
                  <CardDescription>
                    {job.location} • {job.type}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-0">
                  <Button>Apply</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
