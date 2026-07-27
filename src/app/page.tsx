'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ShieldCheck,
  Banknote,
  CreditCard,
  PiggyBank,
  ArrowLeftRight,
  Landmark,
  Award,
  Shield,
  Lock,
  CheckCircle2,
  Building2,
  Smartphone,
  TrendingUp,
  Globe2,
  Clock,
  Users,
  LineChart,
  Headphones,
  Sparkles,
  ArrowRight,
  MapPin,
  Leaf,
} from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';

/* -------------------------------------------------------------------------- */
/* Imagery                                                                    */
/* -------------------------------------------------------------------------- */

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const pexels = (id: string, w = 1200) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

const PHOTOS = {
  heroSkyline: img('photo-1486406146926-c627a92ad1ab', 1600),
  heroAdvisor: img('photo-1521791136064-7986c2920216', 900),
  savings: img('photo-1579621970563-ebec7560ff3e', 800),
  transfers: img('photo-1460925895917-afdab827c52f', 800),
  cards: img('photo-1556742049-0cfed4f6a45d', 800),
  mobile: img('photo-1512941937669-90a1b58e7e9c', 1000),
  growth: img('photo-1551288049-bebda4e38f71', 1000),
  business: img('photo-1600880292203-757bb62b4baf', 1000),
  security: pexels('14820436', 1000),
  branches: img('photo-1449824913935-59a10b8d2000', 1200),
  loans: img('photo-1554224155-6726b3ff858f', 800),
  support: img('photo-1521737604893-d14cc237f11d', 1000),
  team: img('photo-1573164713988-8665fc963095', 1000),
  ctaBand: img('photo-1454165804606-c3d57bc86b40', 1600),
};

/** Plain `<img>` is intentional: these are remote marketing photos and the
 *  project has no next/image remotePatterns configured. */
function Photo({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

/** Fades content up as it scrolls into view. */
function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 0.7, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Content                                                                    */
/* -------------------------------------------------------------------------- */

const HERO_STATS = [
  { value: '1.2M+', label: 'Customers served' },
  { value: '$8.4B', label: 'Deposits managed' },
  { value: '4.35%', label: 'Savings APY' },
  { value: '99.99%', label: 'Platform uptime' },
];

const PRESS = [
  'Financial Times',
  'Bloomberg',
  'Forbes',
  'The Economist',
  'Reuters',
  'TechCrunch',
];

const FEATURED_PRODUCTS = [
  {
    title: 'Edge Savings',
    tag: '4.35% APY',
    photo: PHOTOS.savings,
    icon: PiggyBank,
    body: 'A high-yield account with no minimum balance, no monthly fee, and interest compounded daily. Move money in and out whenever you like.',
    points: ['No monthly fees', 'Interest paid daily', 'FDIC insured to $250k'],
    href: '/open-account',
    cta: 'Open savings',
  },
  {
    title: 'Instant Transfers',
    tag: '60+ countries',
    photo: PHOTOS.transfers,
    icon: ArrowLeftRight,
    body: 'Send money across town or across the world. Domestic transfers settle in seconds and international payments use the real mid-market rate.',
    points: ['Seconds domestically', 'Mid-market FX rate', 'Live tracking'],
    href: '/services/transfers',
    cta: 'See transfer rates',
  },
  {
    title: 'Trust Edge Card',
    tag: '2% cash back',
    photo: PHOTOS.cards,
    icon: CreditCard,
    body: 'Virtual cards issued instantly, physical cards in three days. Freeze, set limits, and create single-use numbers straight from the app.',
    points: ['Instant virtual cards', 'Per-merchant limits', 'Zero FX markup'],
    href: '/services/cards',
    cta: 'Explore cards',
  },
];

const SERVICES = [
  {
    icon: PiggyBank,
    title: 'High-yield Savings',
    body: 'Grow your money with competitive rates and no monthly fees.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Instant Transfers',
    body: 'Move money in seconds, domestically and abroad.',
  },
  {
    icon: CreditCard,
    title: 'Smart Cards',
    body: 'Virtual and physical cards with powerful spending controls.',
  },
  {
    icon: Banknote,
    title: 'Fair Loans',
    body: 'Transparent terms, fast decisions, and flexible repayments.',
  },
  {
    icon: ShieldCheck,
    title: 'Security First',
    body: 'Biometric login, real-time alerts, and industry-grade protection.',
  },
  {
    icon: Globe2,
    title: 'Global Access',
    body: 'Travel confidently with low fees and great exchange rates.',
  },
  {
    icon: LineChart,
    title: 'Money Insights',
    body: 'Automatic categorisation and forecasts you can actually read.',
  },
  {
    icon: Building2,
    title: 'Business Banking',
    body: 'Payroll, invoicing, and multi-user access for growing teams.',
  },
  {
    icon: Headphones,
    title: 'Human Support',
    body: 'Real bankers on chat and phone, 24 hours a day, every day.',
  },
];

const SPLIT_FEATURES = [
  {
    eyebrow: 'Mobile banking',
    title: 'Your whole bank, in your pocket',
    body: 'Deposit a cheque with your camera, split a bill in two taps, and get a push notification the moment money moves. The Trust Edge app is rated 4.9 across both stores.',
    points: [
      'Face and fingerprint sign-in',
      'Cheque deposit by camera',
      'Instant spend notifications',
      'Offline balance snapshot',
    ],
    photo: PHOTOS.mobile,
    href: '/mobile-app',
    cta: 'Get the app',
    icon: Smartphone,
    flip: false,
  },
  {
    eyebrow: 'Saving & growth',
    title: 'Goals that fund themselves',
    body: 'Set a target, and we round up your spending, sweep idle cash from checking, and adjust contributions automatically when your income changes.',
    points: [
      'Round-ups on every purchase',
      'Automatic idle-cash sweeps',
      'Shared goals for households',
      'Projected balance forecasting',
    ],
    photo: PHOTOS.growth,
    href: '/accounts/compare',
    cta: 'Compare accounts',
    icon: TrendingUp,
    flip: true,
  },
  {
    eyebrow: 'For business',
    title: 'Banking built for the people who build',
    body: 'From sole traders to fifty-person teams: multi-user access with granular permissions, same-day payroll, and accounting integrations that reconcile themselves.',
    points: [
      'Role-based team access',
      'Same-day payroll runs',
      'Invoicing and payment links',
      'Xero and QuickBooks sync',
    ],
    photo: PHOTOS.business,
    href: '/services',
    cta: 'Business services',
    icon: Building2,
    flip: false,
  },
];

const RATES = [
  {
    name: 'Everyday Checking',
    rate: '0.75%',
    sub: 'APY on all balances',
    detail: 'No minimum, no monthly fee, fee-free ATM network.',
    popular: false,
  },
  {
    name: 'Edge Savings',
    rate: '4.35%',
    sub: 'APY, compounded daily',
    detail: 'Our flagship account. Withdraw any time without penalty.',
    popular: true,
  },
  {
    name: '12-Month CD',
    rate: '4.60%',
    sub: 'APY, fixed term',
    detail: 'Lock in a guaranteed rate with a $500 minimum deposit.',
    popular: false,
  },
  {
    name: 'Personal Loan',
    rate: '6.90%',
    sub: 'APR from',
    detail: 'Fixed rate, no origination fee, decisions in minutes.',
    popular: false,
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Apply online',
    body: 'Open your Trust Edge account in about five minutes from any device.',
    icon: Smartphone,
  },
  {
    n: '02',
    title: 'Verify identity',
    body: 'Snap a photo of your ID. Most applications are approved the same day.',
    icon: ShieldCheck,
  },
  {
    n: '03',
    title: 'Fund the account',
    body: 'Transfer from another bank or set up direct deposit — no minimum.',
    icon: Banknote,
  },
  {
    n: '04',
    title: 'Start banking',
    body: 'Spend, save, send, and borrow with everything in one dashboard.',
    icon: Sparkles,
  },
];

const SECURITY = [
  {
    icon: Shield,
    title: 'Encryption everywhere',
    desc: 'In transit and at rest',
    body: 'TLS 1.3 across every connection, AES-256 at rest, and hardware-backed key management with routine rotation.',
  },
  {
    icon: Lock,
    title: 'Layered access control',
    desc: 'Defense in depth',
    body: 'Least-privilege internal access, full audit trails on every record, and quarterly independent reviews.',
  },
  {
    icon: CheckCircle2,
    title: 'Regulated and insured',
    desc: 'Built to meet standards',
    body: 'Member FDIC, insured to $250,000 per depositor, with continuous KYC/AML monitoring and SOC 2 Type II controls.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Aria Chen',
    role: 'Freelance designer',
    img: 'https://i.pravatar.cc/120?img=1',
    quote:
      'Opening an account took minutes and transfers are instant. The app nails the details that other banks treat as afterthoughts.',
  },
  {
    name: 'Miguel Santos',
    role: 'Small business owner',
    img: 'https://i.pravatar.cc/120?img=12',
    quote:
      'Transparent fees and genuinely great support. Trust Edge helped me separate business and personal money without any friction.',
  },
  {
    name: 'Priya Patel',
    role: 'Product manager',
    img: 'https://i.pravatar.cc/120?img=5',
    quote:
      'The savings rate is the best I found, and the security controls give me real peace of mind. I moved everything over last spring.',
  },
];

const FAQS = [
  {
    q: 'Is my money protected at Trust Edge Bank?',
    a: 'Yes. Trust Edge Bank, N.A. is a member of the FDIC, and deposits are insured up to $250,000 per depositor, per ownership category.',
  },
  {
    q: 'How long does it take to open an account?',
    a: 'Most applications take about five minutes. If your identity documents verify cleanly, your account is usually ready the same day.',
  },
  {
    q: 'Are there monthly maintenance fees?',
    a: 'No. Everyday Checking and Edge Savings have no monthly fee and no minimum balance requirement. Our full fee schedule is published on the accounts page.',
  },
  {
    q: 'Can I use my card abroad?',
    a: 'Yes, in over 60 countries with no foreign transaction markup. You get the real mid-market rate at the moment the transaction settles.',
  },
  {
    q: 'Do you offer joint and business accounts?',
    a: 'Both. Joint accounts can be opened during the application, and business accounts support multiple users with role-based permissions.',
  },
];

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Home() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [newsletterError, setNewsletterError] = useState('');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterLoading(true);
    setNewsletterError('');
    setNewsletterSuccess(false);

    try {
      const response = await fetch('/api/forms/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewsletterSuccess(true);
        setNewsletterEmail('');
        setTimeout(() => setNewsletterSuccess(false), 5000);
      } else {
        setNewsletterError(data.error || 'Failed to subscribe');
      }
    } catch {
      setNewsletterError('An unexpected error occurred');
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="font-sans">
        {/* ---------------------------------------------------------------- */}
        {/* Hero                                                             */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative overflow-hidden brand-surface text-white">
          <div className="absolute inset-0">
            <Photo
              src={PHOTOS.heroSkyline}
              alt=""
              className="opacity-25 mix-blend-luminosity"
            />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.55),rgba(0,0,0,0.15))]" />

          <div className="relative mx-auto w-full max-w-6xl px-6 py-20 md:py-28">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <motion.div
                className="lg:col-span-6"
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 0.7, 0.3, 1] }}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                  <Leaf className="h-3.5 w-3.5 text-gold" />
                  Now paying 4.35% APY on Edge Savings
                </div>

                <h1 className="mt-6 text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
                  Banking that puts
                  <br />
                  your money to work
                </h1>

                <p className="mt-5 max-w-xl text-base md:text-lg text-white/75">
                  Trust Edge Bank helps you save smarter, transfer instantly,
                  and access fair credit — with enterprise-grade security and
                  people who answer the phone.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-brand-deep hover:bg-white/90"
                  >
                    <a href="/open-account">
                      Open an account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    <a href="/learn-more">Learn more</a>
                  </Button>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/70">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-gold" />
                    FDIC insured to $250k
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gold" />
                    24/7 human support
                  </span>
                  <span className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-gold" />
                    Est. 2013
                  </span>
                </div>
              </motion.div>

              {/* Account preview + inset photo */}
              <motion.div
                className="lg:col-span-6"
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.15,
                  ease: [0.22, 0.7, 0.3, 1],
                }}
              >
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-md">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-background/95 p-4 text-foreground">
                      <div className="text-xs text-muted-foreground">
                        Total balance
                      </div>
                      <div className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight">
                        $24,580.12
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Checking •••• 4821
                      </div>
                    </div>

                    <div className="rounded-xl bg-background/95 p-4 text-foreground">
                      <div className="text-xs text-muted-foreground">
                        Edge Savings
                      </div>
                      <div className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight text-gradient-brand">
                        4.35%
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        +$41.20 this month
                      </div>
                    </div>

                    <div className="col-span-2 rounded-xl bg-background/95 p-4 text-foreground">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">
                          Recent activity
                        </div>
                        <span className="text-xs text-muted-foreground">
                          This week
                        </span>
                      </div>
                      <div className="mt-3 space-y-2.5 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Payroll • ACME Inc.
                          </span>
                          <span className="font-medium text-primary">
                            + $3,200.00
                          </span>
                        </div>
                        <Separator className="h-px" />
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Card • Grocery
                          </span>
                          <span>− $86.27</span>
                        </div>
                        <Separator className="h-px" />
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Transfer • Savings
                          </span>
                          <span>− $500.00</span>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 photo-frame h-32 rounded-xl">
                      <Photo
                        src={PHOTOS.heroAdvisor}
                        alt="A Trust Edge banker meeting with a customer"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Hero stat strip */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-xl border border-white/15 bg-white/10">
              {HERO_STATS.map((s) => (
                <div
                  key={s.label}
                  className="bg-white/5 px-5 py-6 backdrop-blur"
                >
                  <div className="text-2xl md:text-3xl font-semibold tracking-tight">
                    {s.value}
                  </div>
                  <div className="mt-1 text-xs md:text-sm text-white/65">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Press marquee                                                    */}
        {/* ---------------------------------------------------------------- */}
        <section className="border-b bg-secondary/60">
          <div className="mx-auto w-full max-w-6xl px-6 py-8">
            <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
              Covered by
            </p>
            <div className="relative mt-5 overflow-hidden">
              <div className="marquee-track flex w-max items-center gap-14">
                {[...PRESS, ...PRESS].map((name, i) => (
                  <span
                    key={`${name}-${i}`}
                    className="whitespace-nowrap text-lg md:text-xl font-semibold tracking-tight text-muted-foreground/60"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Featured products                                                */}
        {/* ---------------------------------------------------------------- */}
        <section className="border-b">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
            <Reveal>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="max-w-2xl">
                  <Badge variant="secondary" className="mb-3">
                    Featured accounts
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                    Three accounts that do the heavy lifting
                  </h2>
                  <p className="mt-3 text-muted-foreground">
                    Open one in minutes, or hold all three and move money
                    between them instantly at no cost.
                  </p>
                </div>
                <Button asChild variant="outline" className="shrink-0">
                  <a href="/services">View all services</a>
                </Button>
              </div>
            </Reveal>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              {FEATURED_PRODUCTS.map((p, i) => (
                <Reveal key={p.title} delay={i * 0.08} className="h-full">
                  <Card className="lift-card h-full overflow-hidden">
                    <div className="photo-frame h-48">
                      <Photo src={p.photo} alt={p.title} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <Badge className="absolute left-4 top-4 bg-gold text-gold-foreground hover:bg-gold">
                        {p.tag}
                      </Badge>
                      <div className="absolute bottom-3 left-4 flex items-center gap-2 text-white">
                        <p.icon className="h-5 w-5" />
                        <span className="text-lg font-semibold">{p.title}</span>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <p className="text-sm text-muted-foreground">{p.body}</p>
                      <ul className="mt-4 space-y-2">
                        {p.points.map((pt) => (
                          <li
                            key={pt}
                            className="flex items-center gap-2 text-sm"
                          >
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                            {pt}
                          </li>
                        ))}
                      </ul>
                      <Button asChild size="sm" className="mt-6">
                        <a href={p.href}>{p.cta}</a>
                      </Button>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Services grid                                                    */}
        {/* ---------------------------------------------------------------- */}
        <section id="services" className="border-b brand-wash">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
            <Reveal>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                Everything you expect — and more
              </h2>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                From everyday spending to long-term goals, Trust Edge gives
                you tools that are powerful, transparent, and easy to use.
              </p>
            </Reveal>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {SERVICES.map((s, i) => (
                <Reveal key={s.title} delay={(i % 3) * 0.06} className="h-full">
                  <Card className="lift-card h-full bg-card/80 backdrop-blur">
                    <CardHeader>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <s.icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="mt-3 text-base">
                        {s.title}
                      </CardTitle>
                      <CardDescription>{s.body}</CardDescription>
                    </CardHeader>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Alternating image/text features                                  */}
        {/* ---------------------------------------------------------------- */}
        <section className="border-b">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24 space-y-20 md:space-y-28">
            {SPLIT_FEATURES.map((f) => (
              <Reveal key={f.title}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
                  <div className={f.flip ? 'md:order-2' : ''}>
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                      <f.icon className="h-4 w-4" />
                      {f.eyebrow}
                    </div>
                    <h3 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight">
                      {f.title}
                    </h3>
                    <p className="mt-3 text-muted-foreground">{f.body}</p>
                    <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {f.points.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {p}
                        </li>
                      ))}
                    </ul>
                    <Button asChild variant="outline" className="mt-7">
                      <a href={f.href}>
                        {f.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>

                  <div className={f.flip ? 'md:order-1' : ''}>
                    <div className="photo-frame aspect-[4/3] rounded-2xl border shadow-lg">
                      <Photo src={f.photo} alt={f.title} />
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Rates                                                            */}
        {/* ---------------------------------------------------------------- */}
        <section className="border-b brand-wash">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
            <Reveal>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                    Today&apos;s rates
                  </h2>
                  <p className="mt-3 text-muted-foreground">
                    Published openly and updated daily. No teaser rates that
                    quietly expire.
                  </p>
                </div>
                <Button asChild variant="outline">
                  <a href="/loans/rates">Full rate sheet</a>
                </Button>
              </div>
            </Reveal>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {RATES.map((r, i) => (
                <Reveal key={r.name} delay={i * 0.06} className="h-full">
                  <Card
                    className={`lift-card h-full ${
                      r.popular ? 'border-primary shadow-md' : ''
                    }`}
                  >
                    <CardHeader>
                      {r.popular && (
                        <Badge className="mb-2 w-fit bg-gold text-gold-foreground hover:bg-gold">
                          Most popular
                        </Badge>
                      )}
                      <CardDescription>{r.name}</CardDescription>
                      <div className="text-3xl font-semibold tracking-tight text-primary">
                        {r.rate}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.sub}
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      {r.detail}
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              APY = Annual Percentage Yield. Rates shown are illustrative and
              subject to change. Member FDIC.
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* How it works                                                     */}
        {/* ---------------------------------------------------------------- */}
        <section className="border-b">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
            <Reveal>
              <div className="max-w-2xl">
                <Badge variant="secondary" className="mb-3">
                  Getting started
                </Badge>
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                  Open an account in four steps
                </h2>
                <p className="mt-3 text-muted-foreground">
                  The whole thing takes about five minutes, and you can pause
                  and resume from any device.
                </p>
              </div>
            </Reveal>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-5">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 0.08} className="h-full">
                  <Card className="lift-card h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                          <s.icon className="h-5 w-5" />
                        </div>
                        <span className="text-2xl font-semibold text-muted-foreground/25">
                          {s.n}
                        </span>
                      </div>
                      <CardTitle className="mt-3 text-base">
                        {s.title}
                      </CardTitle>
                      <CardDescription>{s.body}</CardDescription>
                    </CardHeader>
                  </Card>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.1}>
              <div className="mt-10 overflow-hidden rounded-2xl border">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="photo-frame min-h-64">
                    <Photo
                      src={PHOTOS.support}
                      alt="Trust Edge Bank support team"
                    />
                  </div>
                  <div className="flex flex-col justify-center p-8 md:p-10">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <Headphones className="h-4 w-4" />
                      Stuck at any point?
                    </div>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                      Talk to a real banker, day or night
                    </h3>
                    <p className="mt-3 text-muted-foreground">
                      Our support team is in-house, never outsourced, and
                      available 24/7 by chat and phone. Average pickup time last
                      quarter was 48 seconds.
                    </p>
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <Button asChild>
                        <a href="/contact">Contact us</a>
                      </Button>
                      <Button asChild variant="outline">
                        <a href="/faq">Browse the FAQ</a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Security                                                         */}
        {/* ---------------------------------------------------------------- */}
        <section className="border-b brand-surface text-white">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <Reveal className="lg:col-span-5">
                <Badge className="mb-3 bg-white/15 text-white hover:bg-white/15">
                  Security &amp; compliance
                </Badge>
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                  Your money, guarded like it&apos;s ours
                </h2>
                <p className="mt-4 text-white/75">
                  We hold ourselves to the standards of a national bank because
                  we are one. Independent auditors test our controls every year,
                  and we publish the results.
                </p>
                <div className="photo-frame mt-8 aspect-[16/10] rounded-2xl border border-white/15">
                  <Photo
                    src={PHOTOS.security}
                    alt="A hand holding folded US hundred-dollar bills"
                    className="opacity-90"
                  />
                </div>
              </Reveal>

              <div className="lg:col-span-7 space-y-4">
                {SECURITY.map((s, i) => (
                  <Reveal key={s.title} delay={i * 0.08}>
                    <div className="rounded-xl border border-white/15 bg-white/5 p-6 backdrop-blur">
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/10 text-gold">
                          <s.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-lg font-semibold">{s.title}</div>
                          <div className="text-xs uppercase tracking-wide text-white/50">
                            {s.desc}
                          </div>
                          <p className="mt-2 text-sm text-white/70">{s.body}</p>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Testimonials                                                     */}
        {/* ---------------------------------------------------------------- */}
        <section className="border-b">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
            <Reveal>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="max-w-2xl">
                  <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                    Trusted by thousands
                  </h2>
                  <p className="mt-3 text-muted-foreground">
                    Real customers, real results. See why people choose Trust
                    Edge to manage their finances with confidence.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">4.9/5 average rating</Badge>
                  <Badge variant="secondary">99.99% uptime</Badge>
                </div>
              </div>
            </Reveal>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <Reveal key={t.name} delay={i * 0.08} className="h-full">
                  <Card className="lift-card h-full">
                    <CardContent className="flex h-full flex-col p-6">
                      <div className="text-lg text-gold">★★★★★</div>
                      <p className="mt-3 flex-1 text-sm leading-relaxed">
                        “{t.quote}”
                      </p>
                      <div className="mt-5 flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={t.img} alt={t.name} />
                          <AvatarFallback>
                            {t.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-sm">
                          <div className="font-medium leading-none">
                            {t.name}
                          </div>
                          <div className="mt-1 leading-none text-muted-foreground">
                            {t.role}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Customer stories                                                 */}
        {/* ---------------------------------------------------------------- */}
        <section className="border-b brand-wash">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
            <Reveal>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                Customer stories
              </h2>
              <p className="mt-3 text-muted-foreground">
                Real outcomes from real people and businesses.
              </p>
            </Reveal>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Growing a small business',
                  desc: 'How a local shop doubled its footprint in two years with Trust Edge business banking, same-day payroll, and a working-capital line.',
                  author: 'Sofia Park • Park & Co.',
                  img: '/sofia.jpg',
                  href: '/stories/growing-small-business',
                },
                {
                  title: 'Saving for a first home',
                  desc: 'Automated round-ups and idle-cash sweeps helped reach a 20% deposit fourteen months ahead of schedule.',
                  author: 'Anthony Rivera',
                  img: '/rivera.jpg',
                  href: '/stories/first-home-savings',
                },
              ].map((c, i) => (
                <Reveal key={c.title} delay={i * 0.08} className="h-full">
                  <Card className="lift-card h-full overflow-hidden">
                    <div className="photo-frame aspect-video">
                      <Photo src={c.img} alt={c.author} />
                    </div>
                    <CardContent className="p-6">
                      <div className="text-lg font-semibold">{c.title}</div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {c.desc}
                      </p>
                      <div className="mt-4 text-xs text-muted-foreground">
                        {c.author}
                      </div>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="mt-5"
                      >
                        <a href={c.href}>Read story</a>
                      </Button>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Branches / presence                                              */}
        {/* ---------------------------------------------------------------- */}
        <section className="border-b">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
            <Reveal>
              <div className="relative overflow-hidden rounded-2xl border">
                <div className="photo-frame absolute inset-0">
                  <Photo src={PHOTOS.branches} alt="" />
                </div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(8,50,35,0.93),rgba(8,50,35,0.6))]" />
                <div className="relative grid grid-cols-1 md:grid-cols-2 gap-10 p-8 md:p-12 text-white">
                  <div>
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-gold">
                      <MapPin className="h-4 w-4" />
                      In your neighbourhood
                    </div>
                    <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
                      Digital first, never digital only
                    </h2>
                    <p className="mt-4 max-w-lg text-white/75">
                      Branches in 38 cities, a fee-free ATM network 55,000
                      machines strong, and advisors you can actually sit down
                      with when the decision is a big one.
                    </p>
                    <Button
                      asChild
                      className="mt-7 bg-white text-brand-deep hover:bg-white/90"
                    >
                      <a href="/about/branches">Find a branch</a>
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 self-center">
                    {[
                      { icon: Building2, v: '38', l: 'Cities with branches' },
                      { icon: Landmark, v: '55,000', l: 'Fee-free ATMs' },
                      { icon: Users, v: '2,400', l: 'Employees' },
                      { icon: Globe2, v: '60+', l: 'Countries served' },
                    ].map((s) => (
                      <div
                        key={s.l}
                        className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur"
                      >
                        <s.icon className="h-5 w-5 text-gold" />
                        <div className="mt-2 text-2xl font-semibold">{s.v}</div>
                        <div className="text-xs text-white/65">{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* FAQ + awards                                                     */}
        {/* ---------------------------------------------------------------- */}
        <section className="border-b brand-wash">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <Reveal className="lg:col-span-7">
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                  Common questions
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Everything people ask before they switch. Still curious?{' '}
                  <a
                    href="/faq"
                    className="text-primary underline underline-offset-4"
                  >
                    Read the full FAQ
                  </a>
                  .
                </p>
                <Accordion type="single" collapsible className="mt-6">
                  {FAQS.map((f) => (
                    <AccordionItem key={f.q} value={f.q}>
                      <AccordionTrigger className="text-base">
                        {f.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {f.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Reveal>

              <Reveal className="lg:col-span-5" delay={0.1}>
                <div className="space-y-5">
                  <Card className="overflow-hidden">
                    <div className="photo-frame h-44">
                      <Photo
                        src={PHOTOS.team}
                        alt="The Trust Edge Bank team"
                      />
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 text-primary">
                        <Award className="h-5 w-5" />
                        <span className="font-semibold">
                          Awards &amp; recognition
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        Named Best Digital Bank 2025 and recognised for customer
                        satisfaction and fintech innovation across 2024–2025.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2 text-primary">
                        <Building2 className="h-5 w-5" />
                        <CardTitle className="text-base">
                          Trusted partners
                        </CardTitle>
                      </div>
                      <CardDescription>
                        We work with leading card networks, clearing houses, and
                        technology providers to keep every service reliable.
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="overflow-hidden">
                    <div className="photo-frame h-36">
                      <Photo src={PHOTOS.loans} alt="Planning a loan" />
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 text-primary">
                        <Banknote className="h-5 w-5" />
                        <span className="font-semibold">Borrow fairly</span>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        Fixed-rate personal loans from 6.90% APR with no
                        origination fee and a decision in minutes.
                      </p>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="mt-4"
                      >
                        <a href="/loans/rates">Check your rate</a>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Newsletter                                                       */}
        {/* ---------------------------------------------------------------- */}
        <section className="border-b">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <Reveal>
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                  Get insights in your inbox
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Product updates, rate changes, and practical money guidance.
                  One email a month, no noise, unsubscribe any time.
                </p>
                <form
                  className="mt-6 flex flex-col sm:flex-row gap-3"
                  onSubmit={handleNewsletterSubmit}
                >
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required
                    className="sm:flex-1"
                  />
                  <Button type="submit" disabled={newsletterLoading}>
                    {newsletterLoading ? 'Subscribing...' : 'Subscribe'}
                  </Button>
                </form>
                {newsletterSuccess && (
                  <div className="mt-4 rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
                    ✓ Thank you for subscribing!
                  </div>
                )}
                {newsletterError && (
                  <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                    {newsletterError}
                  </div>
                )}
              </Reveal>

              <Reveal delay={0.1}>
                <div className="photo-frame aspect-[16/10] rounded-2xl border shadow-lg">
                  <Photo
                    src={PHOTOS.growth}
                    alt="Reviewing financial performance"
                  />
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Bottom CTA                                                       */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative overflow-hidden brand-surface text-white">
          <div className="absolute inset-0">
            <Photo
              src={PHOTOS.ctaBand}
              alt=""
              className="opacity-20 mix-blend-luminosity"
            />
          </div>
          <div className="relative mx-auto w-full max-w-6xl px-6 py-20 md:py-28 text-center">
            <Reveal>
              <Badge className="mb-4 bg-white/15 text-white hover:bg-white/15">
                No monthly fees · No minimum balance
              </Badge>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
                Open your Trust Edge Bank
                <br className="hidden md:block" /> account today
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-white/75">
                Join over a million people who bank with confidence and clarity.
                It takes about five minutes.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-brand-deep hover:bg-white/90"
                >
                  <a href="/open-account">
                    Get started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <a href="/accounts/compare">Compare accounts</a>
                </Button>
              </div>
              <p className="mt-6 text-xs text-white/50">
                Trust Edge Bank, N.A. Member FDIC. Equal Housing Lender.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Global footer is rendered in layout */}
      </div>
    </PageTransition>
  );
}
