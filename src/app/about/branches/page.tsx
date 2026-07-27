'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Phone,
  Clock,
  Building2,
  Navigation,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { BranchMap } from '@/components/BranchMap';
import { GoogleMapsLoader } from '@/components/GoogleMapsLoader';
import { PageTransition } from '@/components/PageTransition';

const branches = [
  {
    id: 'los-angeles',
    name: 'Trust Edge Bank - Los Angeles',
    address: '6310 San Vicente Blvd, Los Angeles, CA 90048, USA',
    lat: 34.0752,
    lng: -118.365,
    hours: 'Mon-Fri: 9:00 AM - 5:00 PM, Sat: 10:00 AM - 2:00 PM',
    city: 'Los Angeles',
    state: 'California',
  },
  {
    id: 'new-york',
    name: 'Trust Edge Bank - New York',
    address: '1330 6th Ave, 23rd Floor, New York, NY 10019, USA',
    lat: 40.7614,
    lng: -73.9776,
    hours: 'Mon-Fri: 9:00 AM - 5:00 PM, Sat: 10:00 AM - 2:00 PM',
    city: 'New York',
    state: 'New York',
  },
  {
    id: 'rock-hill',
    name: 'Trust Edge Bank - Rock Hill',
    address: '220 W White St, Rock Hill, SC 29730, USA',
    lat: 34.9248,
    lng: -81.0251,
    hours: 'Mon-Fri: 9:00 AM - 5:00 PM, Sat: 10:00 AM - 2:00 PM',
    city: 'Rock Hill',
    state: 'South Carolina',
  },
  {
    id: 'johnstown',
    name: 'Trust Edge Bank - Johnstown',
    address: '5388 Ronald Reagan Blvd, Johnstown, CO 80534, USA',
    lat: 40.3369,
    lng: -104.9142,
    hours: 'Mon-Fri: 9:00 AM - 5:00 PM, Sat: 10:00 AM - 2:00 PM',
    city: 'Johnstown',
    state: 'Colorado',
  },
];

export default function BranchesPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        {/* Hero */}
        <section className="max-w-3xl">
          <Badge className="mb-4">Branch Locations</Badge>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Visit us at one of our branches
          </h1>
          <p className="mt-4 text-muted-foreground">
            Experience personalized banking services at any of our conveniently
            located branches across the United States. Our team is here to help
            with all your financial needs.
          </p>
        </section>

        {/* Map Section */}
        <section className="mt-12">
          <div className="rounded-lg overflow-hidden border">
            <GoogleMapsLoader apiKey={apiKey}>
              <BranchMap branches={branches} zoom={4} height="500px" />
            </GoogleMapsLoader>
          </div>
        </section>

        {/* Branch List */}
        <section className="mt-12">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">
            All Locations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {branches.map((branch) => (
              <Card key={branch.id}>
                <CardContent className="p-6">
                  {/* Branch Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{branch.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {branch.city}, {branch.state}
                      </p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex gap-3 mb-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      {branch.address}
                    </p>
                  </div>



                  {/* Hours */}
                  <div className="flex gap-3 mb-4">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      {branch.hours}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                        branch.address
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <Navigation className="mr-2 h-4 w-4" />
                        Get Directions
                      </Button>
                    </a>
                    <Link href="/contact" className="flex-1">
                      <Button size="sm" className="w-full">
                        <Mail className="mr-2 h-4 w-4" />
                        Contact
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Services at Branches */}
        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">
            Services at our branches
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl mb-3">💰</div>
                <h3 className="font-semibold mb-2">Account Services</h3>
                <p className="text-sm text-muted-foreground">
                  Open new accounts, manage existing ones, and get personalized
                  financial advice.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl mb-3">💳</div>
                <h3 className="font-semibold mb-2">Card Services</h3>
                <p className="text-sm text-muted-foreground">
                  Apply for credit cards, report lost cards, and manage your
                  card benefits.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl mb-3">🏠</div>
                <h3 className="font-semibold mb-2">Loan Assistance</h3>
                <p className="text-sm text-muted-foreground">
                  Get help with mortgages, personal loans, and refinancing
                  options.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl mb-3">💼</div>
                <h3 className="font-semibold mb-2">Business Banking</h3>
                <p className="text-sm text-muted-foreground">
                  Business accounts, merchant services, and commercial lending
                  solutions.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl mb-3">🔒</div>
                <h3 className="font-semibold mb-2">Safe Deposit Boxes</h3>
                <p className="text-sm text-muted-foreground">
                  Secure storage for your valuable documents and items.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl mb-3">🤝</div>
                <h3 className="font-semibold mb-2">Financial Planning</h3>
                <p className="text-sm text-muted-foreground">
                  Meet with advisors for retirement planning and investment
                  advice.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16">
          <div className="rounded-xl border bg-card p-8 md:p-10 text-center">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Can&apos;t visit a branch?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Experience full-service banking from anywhere with our online and
              mobile banking.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/open-account">
                <Button>Open Account Online</Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline">Contact Support</Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
