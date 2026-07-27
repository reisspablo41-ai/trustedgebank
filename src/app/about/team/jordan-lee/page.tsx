import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Users,
  TrendingUp,
  Award,
  Mail,
  Linkedin,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Jordan Lee - Chief Executive Officer',
  description:
    'Learn about Jordan Lee, CEO of Trust Edge Bank. 15+ years of experience leading customer-centric financial teams.',
};

export default function JordanLeePage() {
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
            src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=faces"
            alt="Jordan Lee"
          />
          <AvatarFallback>JL</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Jordan Lee
          </h1>
          <p className="text-xl text-muted-foreground mt-2">
            Chief Executive Officer
          </p>
          <div className="flex gap-3 mt-4">
            <Badge variant="secondary">Leadership</Badge>
            <Badge variant="secondary">Strategy</Badge>
            <Badge variant="secondary">Customer Experience</Badge>
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
        <h2 className="text-2xl font-semibold tracking-tight">About Jordan</h2>
        <div className="mt-4 space-y-4 text-muted-foreground">
          <p>
            Jordan Lee is the Chief Executive Officer of Trust Edge Bank, where he
            leads the company’s mission to modernize banking through
            technology and customer-centric design. With over 15 years of
            experience in the financial services industry, Jordan brings a
            wealth of knowledge in operations, strategy, and building
            high-performing teams.
          </p>
          <p>
            Before joining Trust Edge Bank, Jordan served as Chief Operating Officer
            at First National Financial, a leading regional bank with over $10
            billion in assets. There, he spearheaded digital transformation
            initiatives that resulted in a 40% increase in customer satisfaction
            and significant operational efficiencies.
          </p>
          <p>
            Jordan is passionate about creating financial products that empower
            people to achieve their goals. He believes that banking should be
            simple, transparent, and accessible to everyone—values that are at
            the core of Trust Edge Bank’s mission.
          </p>
          <p>
            Jordan holds an MBA from Stanford Graduate School of Business and a
            Bachelor’s degree in Economics from the University of
            California, Berkeley. He is a frequent speaker at fintech
            conferences and serves on the advisory board of several financial
            inclusion nonprofits.
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
                <TrendingUp className="h-5 w-5 text-primary" />
                Growth Leadership
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              Led Trust Edge Bank from 50,000 to over 1.2 million customers in 4
              years through strategic expansion and product innovation.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Customer-First Culture
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              Established customer experience as a core pillar, achieving
              industry-leading NPS scores and 4.9/5 customer ratings.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Operational Excellence
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              Implemented scalable processes and infrastructure that support
              99.99% uptime and rapid feature deployment.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Industry Recognition
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              Named &quot;Top 40 Under 40&quot; by Banking Innovation Magazine
              and recognized as a Fintech Thought Leader by Forbes.
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
                  Chief Executive Officer - Trust Edge Bank
                </div>
                <div className="text-sm text-muted-foreground">
                  2018 - Present
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Leading the company’s vision, strategy, and operations to
                  build the most trusted digital bank.
                </p>
              </div>

              <div className="border-l-2 pl-4">
                <div className="font-medium">
                  Chief Operating Officer - First National Financial
                </div>
                <div className="text-sm text-muted-foreground">2014 - 2018</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Oversaw operations, technology, and customer service for a
                  $10B regional bank.
                </p>
              </div>

              <div className="border-l-2 pl-4">
                <div className="font-medium">
                  Vice President, Strategy - Wells Fargo
                </div>
                <div className="text-sm text-muted-foreground">2010 - 2014</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Led strategic initiatives for digital banking transformation.
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
                  MBA - Stanford Graduate School of Business
                </div>
                <div className="text-sm text-muted-foreground">2008 - 2010</div>
              </div>

              <div className="border-l-2 pl-4">
                <div className="font-medium">
                  B.A. Economics - University of California, Berkeley
                </div>
                <div className="text-sm text-muted-foreground">2004 - 2008</div>
              </div>
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
                Interested in joining our team?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We’re always looking for talented individuals who share our
                vision.
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
