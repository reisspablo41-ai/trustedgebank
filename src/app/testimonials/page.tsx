'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Small Business Owner',
    content:
      'Trust Edge Bank has transformed how I manage my business finances. The instant transfers and detailed analytics have saved me countless hours.',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Software Engineer',
    content:
      'Best banking app I&apos;ve ever used. The interface is clean, intuitive, and the customer support is incredibly responsive.',
    rating: 4.8,
  },
  {
    name: 'Emily Rodriguez',
    role: 'Freelance Designer',
    content:
      'The savings goals feature helped me save for my dream vacation. I love how easy it is to track my progress.',
    rating: 4.6,
  },
  {
    name: 'David Kim',
    role: 'Marketing Director',
    content:
      'Finally, a bank that understands technology. The mobile app is seamless and the security features give me peace of mind.',
    rating: 5,
  },
  {
    name: 'Jessica Martinez',
    role: 'Teacher',
    content:
      'Opening an account was so simple! The KYC process was straightforward and I was approved within hours.',
    rating: 4.2,
  },
  {
    name: 'James Wilson',
    role: 'Entrepreneur',
    content:
      'The refund system is incredibly fast. I got my money back within 24 hours of approval. Impressive service!',
    rating: 4.9,
  },
  {
    name: 'Lisa Anderson',
    role: 'Nurse',
    content:
      'I appreciate the transparency in fees and the detailed transaction history. Trust Edge Bank treats customers with respect.',
    rating: 3.9,
  },
  {
    name: 'Robert Taylor',
    role: 'Architect',
    content:
      'The bill payment feature has simplified my life. I can pay all my bills from one place without any hassle.',
    rating: 4.7,
  },
  {
    name: 'Amanda Foster',
    role: 'Writer',
    content:
      'Excellent customer service! They helped me set up my account and answered all my questions promptly.',
    rating: 5,
  },
  {
    name: 'Christopher Lee',
    role: 'Consultant',
    content:
      'The spending analytics help me understand where my money goes. It&apos;s like having a financial advisor in my pocket.',
    rating: 4.4,
  },
  {
    name: 'Michelle Brown',
    role: 'Real Estate Agent',
    content:
      'I switched to Trust Edge Bank six months ago and haven&apos;t looked back. The interest rates on savings are competitive.',
    rating: 4.9,
  },
  {
    name: 'Daniel Garcia',
    role: 'Chef',
    content:
      'The card management features are fantastic. I can freeze my card instantly if I misplace it.',
    rating: 4.1,
  },
  {
    name: 'Sophia Patel',
    role: 'Photographer',
    content:
      'Love the dark mode! It&apos;s perfect for checking my account at night without straining my eyes.',
    rating: 5,
  },
  {
    name: 'Andrew Thompson',
    role: 'Sales Manager',
    content: `The transfer system is reliable and fast. I've never had an issue sending money to friends or family.`,
    rating: 4.5,
  },
  {
    name: 'Rachel White',
    role: 'Student',
    content:
      'As a student, I appreciate the no monthly fees and the helpful budgeting tools. Trust Edge Bank gets it.',
    rating: 4.8,
  },
  {
    name: 'Kevin Martinez',
    role: 'Engineer',
    content:
      'The security features are top-notch. Two-factor authentication and instant alerts keep my money safe.',
    rating: 3.9,
  },
  {
    name: 'Lauren Harris',
    role: 'Doctor',
    content:
      'Trust Edge Bank makes banking easy even with my busy schedule. Everything I need is right in the app.',
    rating: 4.6,
  },
  {
    name: 'Marcus Johnson',
    role: 'Fitness Trainer',
    content:
      'I love being able to set up automatic savings. My financial goals are finally within reach!',
    rating: 5,
  },
  {
    name: 'Olivia Davis',
    role: 'Lawyer',
    content:
      'Professional, secure, and efficient. Trust Edge Bank handles my finances with the same care I give my clients.',
    rating: 4.3,
  },
  {
    name: 'Thomas Clark',
    role: 'Musician',
    content:
      'The notifications keep me informed about every transaction. I always know what&apos;s happening with my money.',
    rating: 4.7,
  },
  {
    name: 'Isabella Moore',
    role: 'Graphic Designer',
    content:
      'Beautiful design meets powerful functionality. Trust Edge Bank is a perfect example of good UX.',
    rating: 5,
  },
  {
    name: 'Jacob Robinson',
    role: 'Developer',
    content:
      'As a tech person, I appreciate the modern API and integration capabilities. Well-built platform!',
    rating: 4,
  },
  {
    name: 'Mia Walker',
    role: 'HR Manager',
    content:
      'The customer support team is amazing. They resolved my question in minutes via live chat.',
    rating: 4.9,
  },
  {
    name: 'Ethan Hall',
    role: 'Accountant',
    content:
      'The monthly statements are detailed and easy to export. Perfect for tax season!',
    rating: 4.5,
  },
  {
    name: 'Ava Allen',
    role: 'Content Creator',
    content:
      'Trust Edge Bank supports my hustle! Multiple account types and easy transfers make managing income streams simple.',
    rating: 4.8,
  },
  {
    name: 'William Young',
    role: 'Contractor',
    content:
      'The business features are excellent. I can separate personal and business expenses effortlessly.',
    rating: 4.2,
  },
  {
    name: 'Emma King',
    role: 'Veterinarian',
    content:
      'Trustworthy and reliable. I&apos;ve recommended Trust Edge Bank to all my colleagues and friends.',
    rating: 5,
  },
  {
    name: 'Noah Wright',
    role: 'Pilot',
    content:
      'Banking on the go has never been easier. Whether I&apos;m traveling or at home, Trust Edge Bank is always accessible.',
    rating: 4.6,
  },
  {
    name: 'Charlotte Scott',
    role: 'Pharmacist',
    content:
      'The fraud protection is excellent. They caught a suspicious transaction before I even noticed it.',
    rating: 3.9,
  },
  {
    name: 'Benjamin Green',
    role: 'Professor',
    content:
      'Trust Edge Bank combines traditional banking values with modern technology. It&apos;s the best of both worlds!',
    rating: 4.9,
  },
];

/**
 * Five stars with the last one partially filled to match `value`.
 * A filled row is overlaid on an empty row and clipped horizontally, so any
 * fractional rating renders exactly — 4.3 fills 86% of the width.
 */
function StarRating({
  value,
  size = 'sm',
}: {
  value: number;
  size?: 'sm' | 'lg';
}) {
  const px = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));

  return (
    <div
      className="relative inline-flex"
      role="img"
      aria-label={`${value.toFixed(1)} out of 5 stars`}
    >
      <div className="flex" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} className={`${px} text-amber-400/30`} />
        ))}
      </div>
      <div
        className="absolute inset-0 flex overflow-hidden"
        style={{ width: `${pct}%` }}
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            className={`${px} shrink-0 fill-amber-400 text-amber-400`}
          />
        ))}
      </div>
    </div>
  );
}

const averageRating =
  testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length;

export default function TestimonialsPage() {
  return (
    <PageTransition>
      <div className="container mx-auto max-w-6xl py-12 px-4">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            What Our Customers Say
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust Trust Edge Bank for
            their financial needs
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <StarRating value={averageRating} size="lg" />
            <span className="text-sm font-medium">
              {averageRating.toFixed(1)} out of 5 ({testimonials.length} reviews)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <StarRating value={testimonial.rating} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {testimonial.rating.toFixed(1)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  &quot;{testimonial.content}&quot;
                </p>
                <div className="mt-4 pt-4 border-t">
                  <p className="font-semibold text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto bg-primary/5 border-primary/20">
            <CardContent className="pt-8 pb-8">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Join Our Community?
              </h3>
              <p className="text-muted-foreground mb-6">
                Experience the banking excellence that our customers rave about
              </p>
              <a
                href="/open-account"
                className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Open Your Account Today
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
