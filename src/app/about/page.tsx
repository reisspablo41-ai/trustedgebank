'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ShieldCheck,
  Target,
  Handshake,
  Scale,
  Building2,
  Award,
  Cpu,
  Users,
  CheckCircle2,
  Globe2,
  HandHeart,
} from 'lucide-react';
import { PageTransition, SlideUp } from '@/components/PageTransition';

export default function AboutPage() {
  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        {/* Hero */}
        <SlideUp>
          <section className="max-w-3xl">
            <Badge className="mb-4">About Trust Edge Bank</Badge>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Building a bank people love and trust
            </h1>
            <p className="mt-4 text-muted-foreground">
              We combine deep financial expertise with modern technology to
              deliver secure, fair, and easy-to-use products that help you save,
              spend, and plan with confidence.
            </p>
          </section>
        </SlideUp>

        {/* Our Journey / Timeline */}
        <section className="mt-12">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Our journey
          </h2>
          <p className="mt-2 text-muted-foreground max-w-prose">
            From a small team with a big idea to a trusted digital bank.
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                year: '2013',
                title: 'Founded',
                desc: 'Trust Edge is incorporated with a mission to modernize banking.',
              },
              {
                year: '2016',
                title: 'Public launch',
                desc: 'Checking and savings accounts go live with mobile-first design.',
              },
              {
                year: '2020',
                title: 'Scale & reliability',
                desc: '99.99% uptime achieved with expanded risk and support teams.',
              },
            ].map((t) => (
              <Card key={t.year}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t.year} — {t.title}
                  </CardTitle>
                  <CardDescription>{t.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Mission / Vision / Values */}
        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Mission, vision, and values
          </h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" /> Mission
                </CardTitle>
                <CardDescription>What drives us</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-sm">
                Empower people and businesses with secure, transparent, and
                easy-to-use financial tools.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" /> Vision
                </CardTitle>
                <CardDescription>Where we are headed</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-sm">
                Build the most trusted digital bank, known for reliability,
                fairness, and world-class customer experience.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" /> Values
                </CardTitle>
                <CardDescription>Principles that guide us</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-sm">
                Security first. Fair and transparent. Customer-obsessed. Built
                for the long term.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Leadership */}
        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Leadership
          </h2>
          <p className="mt-2 text-muted-foreground max-w-prose">
            Experienced operators and technologists with a track record of
            building reliable financial systems.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'Jordan Lee',
                role: 'Chief Executive Officer',
                img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=faces',
                bio: 'Previously COO at a national bank. 15+ years leading customer-centric teams.',
                link: '/about/team/jordan-lee',
              },
              {
                name: 'Samira Khan',
                role: 'Chief Technology Officer',
                img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=faces',
                bio: 'Ex-FAANG engineering leader. Focused on reliability and developer velocity.',
                link: '/about/team/samira-khan',
              },
              {
                name: 'Daniel Rossi',
                role: 'Chief Risk Officer',
                img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=faces',
                bio: 'Risk and compliance expert with deep fintech experience.',
                link: '/about/team/daniel-rossi',
              },
            ].map((m) => (
              <Card key={m.name}>
                <CardContent className="p-6">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={m.img} alt={m.name} />
                    <AvatarFallback>
                      {m.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="mt-4">
                    <div className="font-medium">{m.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {m.role}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {m.bio}
                    </p>
                    <div className="mt-3 text-sm">
                      <a href={m.link} className="text-primary hover:underline">
                        View profile
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Core values
          </h2>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" /> Security
                  first
                </CardTitle>
                <CardDescription>Protection by design</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-sm">
                We prioritize safety in every decision we make, using modern
                encryption, access controls, and monitoring.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" /> Fair and
                  transparent
                </CardTitle>
                <CardDescription>No hidden fees</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-sm">
                Clear pricing and unbiased decisions that treat every customer
                fairly.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Handshake className="h-5 w-5 text-primary" />{' '}
                  Customer-obsessed
                </CardTitle>
                <CardDescription>We listen and improve</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-sm">
                We build with empathy and iterate quickly to deliver the best
                experiences.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Technology & Innovation */}
        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Technology & innovation
          </h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-primary" /> Modern platform
                </CardTitle>
                <CardDescription>Speed and reliability</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-sm">
                Cloud-native infrastructure, automated testing, and continuous
                delivery.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Thoughtful UX
                </CardTitle>
                <CardDescription>Designed for clarity</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-sm">
                Intuitive flows and accessibility-first design across devices.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe2 className="h-5 w-5 text-primary" /> Global-ready
                </CardTitle>
                <CardDescription>Built to scale</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-sm">
                Internationalization and performant APIs for cross-border
                features.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Security & Compliance */}
        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Security & compliance
          </h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Security program</CardTitle>
                <CardDescription>Continuous protection</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-sm">
                Enterprise-grade encryption, least-privilege access, independent
                audits, and 24/7 monitoring help keep your money and data safe.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Compliance</CardTitle>
                <CardDescription>Built to meet standards</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-sm">
                Member FDIC. We maintain robust KYC/AML procedures and comply
                with applicable regulations in the jurisdictions where we
                operate.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Customer impact */}
        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Customer impact
          </h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> 1.2M+ customers
                </CardTitle>
                <CardDescription>Across 50+ states and regions</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" /> 4.9/5 rating
                </CardTitle>
                <CardDescription>Service our customers love</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" /> 99.99%
                  uptime
                </CardTitle>
                <CardDescription>Reliable and always on</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Community & social responsibility */}
        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Community
          </h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <HandHeart className="h-5 w-5 text-primary" /> Financial
                  literacy
                </CardTitle>
                <CardDescription>Workshops and mentorship</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-sm">
                We sponsor programs that teach budgeting and saving skills.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe2 className="h-5 w-5 text-primary" /> Sustainability
                </CardTitle>
                <CardDescription>Carbon-aware operations</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-sm">
                Optimizing data centers and partnering on green initiatives.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" /> Local impact
                </CardTitle>
                <CardDescription>Small business grants</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-sm">
                Funding and support for community entrepreneurs.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16">
          <div className="rounded-xl border bg-card p-8 md:p-10 text-center">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Join Trust Edge Bank today
            </h2>
            <p className="mt-2 text-muted-foreground">
              Open an account in minutes and start banking better.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Contact us
              </a>
              <a
                href="/services"
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
              >
                Explore services
              </a>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
