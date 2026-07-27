import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Code,
  Server,
  Shield,
  Zap,
  Mail,
  Linkedin,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Samira Khan - Chief Technology Officer',
  description:
    'Learn about Samira Khan, CTO of Trust Edge Bank. Ex-FAANG engineering leader focused on reliability and innovation.',
};

export default function SamiraKhanPage() {
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
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=faces"
            alt="Samira Khan"
          />
          <AvatarFallback>SK</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Samira Khan
          </h1>
          <p className="text-xl text-muted-foreground mt-2">
            Chief Technology Officer
          </p>
          <div className="flex gap-3 mt-4">
            <Badge variant="secondary">Engineering</Badge>
            <Badge variant="secondary">Architecture</Badge>
            <Badge variant="secondary">Innovation</Badge>
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
        <h2 className="text-2xl font-semibold tracking-tight">About Samira</h2>
        <div className="mt-4 space-y-4 text-muted-foreground">
          <p>
            Samira Khan is the Chief Technology Officer at Trust Edge Bank, where
            she leads the engineering organization and drives technical
            innovation. With over 12 years of experience building large-scale
            distributed systems, Samira is passionate about creating reliable,
            secure, and performant technology that serves millions of customers.
          </p>
          <p>
            Before joining Trust Edge Bank, Samira spent 8 years at Google, where
            she most recently served as Engineering Director for Google Pay. She
            led teams of 100+ engineers building payment infrastructure that
            processed billions of transactions annually. Prior to Google, she
            was a senior engineer at Amazon Web Services, working on core
            infrastructure services.
          </p>
          <p>
            At Trust Edge Bank, Samira has architected the company’s modern
            cloud-native platform, achieving 99.99% uptime while maintaining
            rapid development velocity. She champions engineering excellence,
            developer experience, and building diverse, inclusive teams.
          </p>
          <p>
            Samira holds a Master’s degree in Computer Science from MIT and
            a Bachelor’s degree in Electrical Engineering from Stanford
            University. She’s an active contributor to open-source projects
            and regularly speaks at technical conferences about distributed
            systems and fintech engineering.
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
                <Server className="h-5 w-5 text-primary" />
                Platform Excellence
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              Built cloud-native infrastructure achieving 99.99% uptime and
              sub-100ms API response times at scale.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security Leadership
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              Implemented zero-trust architecture, end-to-end encryption, and
              automated security testing across all systems.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Developer Velocity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              Reduced deployment time from weeks to hours through CI/CD
              automation and infrastructure-as-code practices.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Team Building
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              Grew engineering team from 12 to 80+ members while maintaining
              high technical standards and inclusive culture.
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
                  Chief Technology Officer - Trust Edge Bank
                </div>
                <div className="text-sm text-muted-foreground">
                  2019 - Present
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Leading engineering, product, and design teams to build
                  secure, scalable banking technology.
                </p>
              </div>

              <div className="border-l-2 pl-4">
                <div className="font-medium">
                  Engineering Director, Google Pay - Google
                </div>
                <div className="text-sm text-muted-foreground">2016 - 2019</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Led engineering for payment infrastructure processing billions
                  of transactions globally.
                </p>
              </div>

              <div className="border-l-2 pl-4">
                <div className="font-medium">
                  Senior Software Engineer - Google
                </div>
                <div className="text-sm text-muted-foreground">2014 - 2016</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Built core infrastructure for Google’s payment systems.
                </p>
              </div>

              <div className="border-l-2 pl-4">
                <div className="font-medium">
                  Software Engineer - Amazon Web Services
                </div>
                <div className="text-sm text-muted-foreground">2011 - 2014</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Worked on distributed storage and compute services.
                </p>
              </div>
            </div>
          </div>

          {/* Education */}
          <div>
            <h3 className="font-semibold text-lg">Education</h3>
            <div className="mt-4 space-y-4">
              <div className="border-l-2 border-primary pl-4">
                <div className="font-medium">
                  M.S. Computer Science - Massachusetts Institute of Technology
                </div>
                <div className="text-sm text-muted-foreground">2009 - 2011</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Focus: Distributed Systems & Cryptography
                </p>
              </div>

              <div className="border-l-2 pl-4">
                <div className="font-medium">
                  B.S. Electrical Engineering - Stanford University
                </div>
                <div className="text-sm text-muted-foreground">2005 - 2009</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Graduated with Distinction
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Expertise */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">
          Technical Expertise
        </h2>
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            'Cloud Architecture',
            'Distributed Systems',
            'Payment Systems',
            'Security Engineering',
            'DevOps & SRE',
            'Microservices',
            'Database Design',
            'API Design',
            'Infrastructure as Code',
            'Kubernetes',
            'Continuous Deployment',
            'System Design',
          ].map((skill) => (
            <Badge key={skill} variant="outline">
              {skill}
            </Badge>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-12">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold">
                Interested in joining our engineering team?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We’re building the future of digital banking. Join us!
              </p>
              <div className="mt-4 flex gap-3 justify-center">
                <Link href="/careers">
                  <Button>View Engineering Roles</Button>
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
