import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Shield,
  FileCheck,
  Scale,
  AlertTriangle,
  Mail,
  Linkedin,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Daniel Rossi - Chief Risk Officer',
  description:
    'Learn about Daniel Rossi, CRO of Trust Edge Bank. Risk and compliance expert with deep fintech experience.',
};

export default function DanielRossiPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 md:py-20">
      {/* Back Button */}
      <Link href="/about">
        <Button variant="ghost" size="sm" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to About Us
        </Button>
      </Link>

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <Avatar className="h-32 w-32 md:h-40 md:w-40">
          <AvatarImage
            src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=faces"
            alt="Daniel Rossi"
          />
          <AvatarFallback>DR</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Daniel Rossi
          </h1>
          <p className="text-xl text-muted-foreground mt-2">
            Chief Risk Officer
          </p>
          <div className="flex gap-3 mt-4">
            <Badge variant="secondary">Risk Management</Badge>
            <Badge variant="secondary">Compliance</Badge>
            <Badge variant="secondary">Regulatory</Badge>
          </div>

          {/* Contact Links */}
          <div className="flex gap-3 mt-6">
            <Button variant="outline" size="sm">
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
            <Button variant="outline" size="sm">
              <Linkedin className="mr-2 h-4 w-4" />
              LinkedIn
            </Button>
          </div>
        </div>
      </div>

      {/* Bio Section */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">About Daniel</h2>
        <div className="mt-4 space-y-4 text-muted-foreground">
          <p>
            Daniel Rossi is the Chief Risk Officer at Trust Edge Bank, where he
            oversees all aspects of risk management, compliance, fraud
            prevention, and regulatory relations. With over 18 years of
            experience in financial services risk and compliance, Daniel brings
            deep expertise in building robust risk frameworks for fast-growing
            fintech companies.
          </p>
          <p>
            Before joining Trust Edge Bank, Daniel served as Head of Risk and
            Compliance at Square, where he built and scaled the risk
            organization to support the company’s rapid growth. Prior to
            Square, he held senior risk positions at JPMorgan Chase, where he
            led enterprise-wide risk programs and managed relationships with
            federal banking regulators.
          </p>
          <p>
            At Trust Edge Bank, Daniel has established a comprehensive risk
            management framework that balances innovation with prudent risk
            controls. His team focuses on fraud prevention, anti-money
            laundering (AML), Know Your Customer (KYC) procedures,
            cybersecurity, and regulatory compliance. Under his leadership,
            Trust Edge Bank has maintained an exceptional track record with zero
            major compliance incidents.
          </p>
          <p>
            Daniel holds a J.D. from Columbia Law School, where he focused on
            banking and securities regulation, and a B.A. in Economics from the
            University of Pennsylvania. He is a Certified Anti-Money Laundering
            Specialist (CAMS) and frequently advises fintech startups on
            regulatory strategy.
          </p>
        </div>
      </section>

      {/* Key Achievements */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">
          Key Achievements
        </h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Fraud Prevention
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              Implemented advanced fraud detection systems reducing fraud losses
              by 85% while maintaining seamless customer experience.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                Compliance Excellence
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              Achieved zero major regulatory findings across multiple audits and
              examinations by federal banking regulators.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Regulatory Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              Successfully navigated complex regulatory landscape, obtaining key
              licenses and maintaining strong regulator relationships.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Risk Framework
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              Built comprehensive risk management framework covering credit,
              market, operational, and liquidity risks.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Experience & Education */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">
          Experience & Education
        </h2>

        <div className="mt-6 space-y-6">
          {/* Experience */}
          <div>
            <h3 className="font-semibold text-lg">Professional Experience</h3>
            <div className="mt-4 space-y-4">
              <div className="border-l-2 border-primary pl-4">
                <div className="font-medium">
                  Chief Risk Officer - Trust Edge Bank
                </div>
                <div className="text-sm text-muted-foreground">
                  2017 - Present
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Leading risk, compliance, fraud prevention, and regulatory
                  strategy for a fast-growing digital bank.
                </p>
              </div>

              <div className="border-l-2 pl-4">
                <div className="font-medium">
                  Head of Risk and Compliance - Square
                </div>
                <div className="text-sm text-muted-foreground">2013 - 2017</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Built and scaled risk organization supporting payment
                  processing for millions of merchants.
                </p>
              </div>

              <div className="border-l-2 pl-4">
                <div className="font-medium">
                  Vice President, Enterprise Risk Management - JPMorgan Chase
                </div>
                <div className="text-sm text-muted-foreground">2009 - 2013</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Led enterprise-wide risk programs and managed regulatory
                  relationships.
                </p>
              </div>

              <div className="border-l-2 pl-4">
                <div className="font-medium">Risk Manager - Citigroup</div>
                <div className="text-sm text-muted-foreground">2006 - 2009</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Managed credit and operational risk for retail banking
                  operations.
                </p>
              </div>
            </div>
          </div>

          {/* Education */}
          <div>
            <h3 className="font-semibold text-lg">Education</h3>
            <div className="mt-4 space-y-4">
              <div className="border-l-2 border-primary pl-4">
                <div className="font-medium">J.D. - Columbia Law School</div>
                <div className="text-sm text-muted-foreground">2003 - 2006</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Focus: Banking & Securities Regulation
                </p>
              </div>

              <div className="border-l-2 pl-4">
                <div className="font-medium">
                  B.A. Economics - University of Pennsylvania
                </div>
                <div className="text-sm text-muted-foreground">1999 - 2003</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Magna Cum Laude
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications & Expertise */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">
          Certifications & Expertise
        </h2>
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="font-semibold">Certifications</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                'Certified Anti-Money Laundering Specialist (CAMS)',
                'Financial Risk Manager (FRM)',
                'Certified Regulatory Compliance Manager (CRCM)',
              ].map((cert) => (
                <Badge key={cert} variant="secondary">
                  {cert}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold">Areas of Expertise</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                'Risk Management',
                'AML/BSA Compliance',
                'Fraud Prevention',
                'KYC/CIP Programs',
                'Regulatory Relations',
                'OFAC Sanctions',
                'Cybersecurity Risk',
                'Credit Risk',
                'Operational Risk',
                'Enterprise Risk Framework',
                'Banking Regulations',
                'Consumer Protection',
              ].map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-12">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold">
                Interested in joining our risk and compliance team?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We’re building a world-class risk organization. Join us!
              </p>
              <div className="mt-4 flex gap-3 justify-center">
                <Link href="/careers">
                  <Button>View Open Positions</Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline">Contact Us</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
