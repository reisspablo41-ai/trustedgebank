'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MessageSquare, MapPin } from 'lucide-react';
import { BranchMap } from '@/components/BranchMap';
import { GoogleMapsLoader } from '@/components/GoogleMapsLoader';
import Link from 'next/link';
import { PageTransition } from '@/components/PageTransition';

const branches = [
  {
    id: 'los-angeles',
    name: 'Trust Edge Bank - Los Angeles',
    address: '6310 San Vicente Blvd, Los Angeles, CA 90048, USA',
    lat: 34.0752,
    lng: -118.365,
    hours: 'Mon-Fri: 9:00 AM - 5:00 PM',
  },
  {
    id: 'new-york',
    name: 'Trust Edge Bank - New York',
    address: '1330 6th Ave, 23rd Floor, New York, NY 10019, USA',
    lat: 40.7614,
    lng: -73.9776,
    hours: 'Mon-Fri: 9:00 AM - 5:00 PM',
  },
  {
    id: 'rock-hill',
    name: 'Trust Edge Bank - Rock Hill',
    address: '220 W White St, Rock Hill, SC 29730, USA',
    lat: 34.9248,
    lng: -81.0251,
    hours: 'Mon-Fri: 9:00 AM - 5:00 PM',
  },
  {
    id: 'johnstown',
    name: 'Trust Edge Bank - Johnstown',
    address: '5388 Ronald Reagan Blvd, Johnstown, CO 80534, USA',
    lat: 40.3369,
    lng: -104.9142,
    hours: 'Mon-Fri: 9:00 AM - 5:00 PM',
  },
];

export default function ContactPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/forms/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setName('');
        setEmail('');
        setMessage('');
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        <section>
          <Badge className="mb-4">Support</Badge>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            We are here to help
          </h1>
          <p className="mt-4 text-muted-foreground max-w-prose">
            Reach out anytime. Our support team is available around the clock.
          </p>
        </section>

        <section className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Send us a message</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit}>
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="How can we help?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>
                {success && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-sm text-green-800 dark:text-green-200">
                    ✓ Your message has been sent successfully!
                  </div>
                )}
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-800 dark:text-red-200">
                    {error}
                  </div>
                )}
                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full md:w-auto"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Submit'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" /> Email
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm">
                contact@trustedgebank.com
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" /> Live chat
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm">
                Chat with us 24/7 in the app or web dashboard.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> Branch locations
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm">
                <div className="rounded-md overflow-hidden border">
                  <GoogleMapsLoader apiKey={apiKey}>
                    <BranchMap branches={branches} zoom={4} height="300px" />
                  </GoogleMapsLoader>
                </div>
                <div className="mt-3">
                  <Link href="/about/branches">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Branches
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
