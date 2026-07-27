'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PageTransition,
  SlideUp,
  StaggerContainer,
  StaggerItem,
} from '@/components/PageTransition';
import {
  CreditCard,
  Shield,
  Globe,
  Sparkles,
  Lock,
  Smartphone,
  AlertCircle,
  DollarSign,
  CheckCircle2,
  Zap,
  TrendingUp,
  Gift,
} from 'lucide-react';
import Link from 'next/link';

export default function CardServicesPage() {
  const cardTypes = [
    {
      name: 'Debit Card',
      description: 'Instant access to your checking account',
      features: [
        'No annual fee',
        'ATM withdrawals',
        'Contactless payments',
        'Instant notifications',
      ],
      icon: CreditCard,
      badge: 'Most Popular',
    },
    {
      name: 'Credit Card',
      description: 'Build credit with competitive rates',
      features: [
        'Cashback rewards',
        'No foreign fees',
        'Purchase protection',
        'Credit building',
      ],
      icon: Sparkles,
      badge: 'Coming Soon',
    },
    {
      name: 'Virtual Card',
      description: 'Secure online shopping',
      features: [
        'Instant issuance',
        'One-time use option',
        'Enhanced security',
        'Spending controls',
      ],
      icon: Smartphone,
      badge: 'Available',
    },
  ];

  const features = [
    {
      icon: Shield,
      title: 'Advanced Security',
      description:
        'EMV chip technology, fraud monitoring, and instant card lock from your dashboard.',
    },
    {
      icon: Globe,
      title: 'Global Acceptance',
      description:
        'Use your card anywhere Visa is accepted worldwide with competitive exchange rates.',
    },
    {
      icon: Zap,
      title: 'Instant Notifications',
      description:
        "Get real-time alerts for every transaction, so you always know what's happening.",
    },
    {
      icon: Lock,
      title: 'Spending Controls',
      description:
        'Set spending limits, freeze cards temporarily, and manage recurring payments.',
    },
    {
      icon: DollarSign,
      title: 'No Hidden Fees',
      description:
        'Transparent pricing with no monthly fees, maintenance charges, or surprise costs.',
    },
    {
      icon: TrendingUp,
      title: 'Rewards & Cashback',
      description:
        'Earn rewards on everyday purchases and get cashback on eligible transactions.',
    },
  ];

  const benefits = [
    'Zero liability protection for unauthorized transactions',
    'Free replacement cards if lost or stolen',
    '24/7 customer support and fraud monitoring',
    'Contactless and mobile wallet compatible',
    'No foreign transaction fees on international purchases',
    'Instant card freeze and unfreeze from your dashboard',
  ];

  return (
    <PageTransition>
      <div className="font-sans">
        {/* Hero */}
        <section className="relative border-b">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
            <SlideUp>
              <div className="max-w-3xl">
                <Badge className="mb-4">Card Services</Badge>
                <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
                  Cards designed for how you spend
                </h1>
                <p className="mt-4 text-muted-foreground text-base md:text-lg">
                  From everyday debit cards to premium credit options, Trust Edge
                  Bank gives you secure, flexible payment solutions with
                  powerful controls and zero hidden fees.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Link href="/dashboard/cards">
                    <Button className="w-full sm:w-auto">Request a Card</Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button variant="outline" className="w-full sm:w-auto">
                      Manage Your Cards
                    </Button>
                  </Link>
                </div>
              </div>
            </SlideUp>
          </div>
        </section>

        {/* Card Types */}
        <section className="border-b">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
            <SlideUp>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Choose the right card for you
              </h2>
              <p className="mt-2 text-muted-foreground">
                Whether it&apos;s everyday spending or building credit, we have
                a card that fits your needs.
              </p>
            </SlideUp>
            <StaggerContainer>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {cardTypes.map((card) => (
                  <StaggerItem key={card.name}>
                    <Card className="h-full">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                            <card.icon className="h-6 w-6 text-primary" />
                          </div>
                          <Badge
                            variant={
                              card.badge === 'Coming Soon'
                                ? 'secondary'
                                : 'default'
                            }
                          >
                            {card.badge}
                          </Badge>
                        </div>
                        <CardTitle>{card.name}</CardTitle>
                        <CardDescription>{card.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {card.features.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-center gap-2 text-sm"
                            >
                              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                ))}
              </div>
            </StaggerContainer>
          </div>
        </section>

        {/* Features */}
        <section className="border-b bg-secondary/40">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
            <SlideUp>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Powerful features built in
              </h2>
              <p className="mt-2 text-muted-foreground">
                Every Trust Edge card comes with industry-leading security and
                convenience features.
              </p>
            </SlideUp>
            <StaggerContainer>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature) => (
                  <StaggerItem key={feature.title}>
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                            <feature.icon className="h-5 w-5 text-primary" />
                          </div>
                          <CardTitle className="text-base">
                            {feature.title}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                ))}
              </div>
            </StaggerContainer>
          </div>
        </section>

        {/* Benefits */}
        <section className="border-b">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <SlideUp>
                <div>
                  <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                    More than just a card
                  </h2>
                  <p className="mt-4 text-muted-foreground">
                    With Trust Edge cards, you get peace of mind and complete
                    control over your spending.
                  </p>
                  <ul className="mt-6 space-y-3">
                    {benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </SlideUp>

              <SlideUp delay={0.2}>
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="p-8">
                    <Gift className="h-12 w-12 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      Welcome Bonus
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Get $50 cashback when you spend $500 in your first 3
                      months with a new Trust Edge debit card.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      *Terms and conditions apply. New customers only.
                    </p>
                  </CardContent>
                </Card>
              </SlideUp>
            </div>
          </div>
        </section>

        {/* Security Notice */}
        <section className="border-b bg-secondary/40">
          <div className="mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
            <SlideUp>
              <Card>
                <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">
                      Your security matters
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      All Trust Edge cards are protected by advanced fraud
                      detection, zero liability protection, and 24/7 monitoring.
                      Never share your card details, PIN, or CVV with anyone.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </SlideUp>
          </div>
        </section>

        {/* CTA */}
        <section className="border-b">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
            <SlideUp>
              <Card className="text-center">
                <CardContent className="p-8 md:p-10">
                  <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                    Ready to get your card?
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    Open a Trust Edge account and request your card today. It takes
                    just minutes.
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/open-account">
                      <Button>Open Account</Button>
                    </Link>
                    <Link href="/contact">
                      <Button variant="outline">Contact Support</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </SlideUp>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
