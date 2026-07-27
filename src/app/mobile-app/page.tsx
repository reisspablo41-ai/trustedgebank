'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageTransition, SlideUp } from '@/components/PageTransition';
import {
  Smartphone,
  Apple,
  Play,
  Bell,
  CheckCircle2,
  Zap,
  Shield,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';

export default function MobileAppPage() {
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [notifyError, setNotifyError] = useState('');

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotifyLoading(true);
    setNotifyError('');
    setNotifySuccess(false);

    try {
      const response = await fetch('/api/forms/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: notifyEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setNotifySuccess(true);
        setNotifyEmail('');
        setTimeout(() => setNotifySuccess(false), 5000);
      } else {
        setNotifyError(data.error || 'Failed to submit request');
      }
    } catch {
      setNotifyError('An unexpected error occurred');
    } finally {
      setNotifyLoading(false);
    }
  };
  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        {/* Hero */}
        <SlideUp>
          <section className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <Smartphone className="h-10 w-10 text-primary" />
            </div>
            <Badge className="mb-4">Coming Soon</Badge>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Trust Edge Bank Mobile App
            </h1>
            <p className="mt-4 text-muted-foreground text-lg">
              Banking on-the-go is almost here. Get notified when our mobile app
              launches for iOS and Android.
            </p>
          </section>
        </SlideUp>

        {/* Notify Me */}
        <SlideUp delay={0.1}>
          <section className="mt-12 max-w-xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Bell className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Get notified at launch</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Be the first to know when our mobile app is available.
                  We’ll send you a one-time email when it’s ready to
                  download.
                </p>
                <form
                  className="flex flex-col sm:flex-row gap-3"
                  onSubmit={handleNotifySubmit}
                >
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Button type="submit" disabled={notifyLoading}>
                    {notifyLoading ? 'Submitting...' : 'Notify Me'}
                  </Button>
                </form>
                {notifySuccess && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-sm text-green-800 dark:text-green-200">
                    ✓ Thank you! We’ll notify you when the app launches.
                  </div>
                )}
                {notifyError && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-800 dark:text-red-200">
                    {notifyError}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </SlideUp>

        {/* Platforms */}
        <SlideUp delay={0.2}>
          <section className="mt-12">
            <h2 className="text-2xl font-semibold tracking-tight text-center mb-6">
              Available on
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Card>
                <CardContent className="p-6 text-center">
                  <Apple className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">iOS App</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Coming soon to the App Store
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Requires iOS 15.0 or later
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Play className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Android App</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Coming soon to Google Play
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Requires Android 8.0 or later
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        </SlideUp>

        {/* Features Preview */}
        <SlideUp delay={0.3}>
          <section className="mt-16">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-center mb-6">
              What to expect
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Lightning Fast</h3>
                  <p className="text-sm text-muted-foreground">
                    Instant transfers and real-time balance updates
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Secure</h3>
                  <p className="text-sm text-muted-foreground">
                    Biometric login and end-to-end encryption
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <CreditCard className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Card Control</h3>
                  <p className="text-sm text-muted-foreground">
                    Freeze cards, set limits, and manage spending
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Easy to Use</h3>
                  <p className="text-sm text-muted-foreground">
                    Intuitive design for effortless banking
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        </SlideUp>

        {/* Current Access */}
        <SlideUp delay={0.4}>
          <section className="mt-16">
            <Card className="bg-secondary/40">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-semibold mb-2">
                  Meanwhile, use our web app
                </h3>
                <p className="text-muted-foreground mb-6">
                  Access all your banking features from any browser while you
                  wait for the mobile app.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/auth/login">
                    <Button>Sign In to Web App</Button>
                  </Link>
                  <Link href="/open-account">
                    <Button variant="outline">Open Account</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>
        </SlideUp>
      </div>
    </PageTransition>
  );
}
