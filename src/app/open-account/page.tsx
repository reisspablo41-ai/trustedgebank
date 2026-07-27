'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supbaseClient';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export default function OpenAccountPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError('You must agree to the terms and privacy policy.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { data, error: signErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone } },
      });
      if (signErr) throw signErr;
      const user = data.user;
      const session = data.session;

      if (!user) throw new Error('Sign up failed');

      // Store session in cookie for middleware
      if (session) {
        document.cookie = `trustedge-session=${JSON.stringify({
          userId: user.id,
          accessToken: session.access_token,
        })};path=/;max-age=3600;SameSite=Lax`;
      }

      // User creation is handled by database trigger on auth.users
      // ensuring bank_users profile is created automatically.

      router.push('/auth/verify-pending');
    } catch (err: any) {
      console.error('❌ Open account error:', err);
      console.error('❌ Error message:', err?.message);
      console.error('❌ Error details:', JSON.stringify(err, null, 2));
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
      <section>
        <Badge className="mb-4">Get started</Badge>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Open your Trust Edge account
        </h1>
        <p className="mt-4 text-muted-foreground max-w-prose">
          Create your account to get started. Already have an account?{' '}
          <a href="/auth/login" className="text-primary hover:underline">
            Log in
          </a>
        </p>
      </section>

      <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Sign up</CardTitle>
            <CardDescription>
              We&apos;ll verify your email before proceeding to identity
              verification
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form className="grid grid-cols-1 gap-4" onSubmit={onSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full name *</Label>
                <Input
                  id="fullName"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
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
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  At least 8 characters with uppercase, lowercase, and number
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 555-5555"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) =>
                    setAgreedToTerms(checked === true)
                  }
                />
                <label
                  htmlFor="terms"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the{' '}
                  <a
                    href="/legal/terms"
                    className="text-primary hover:underline"
                    target="_blank"
                  >
                    Terms & Conditions
                  </a>{' '}
                  and{' '}
                  <a
                    href="/legal/privacy"
                    className="text-primary hover:underline"
                    target="_blank"
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>
              {error && <div className="text-sm text-red-600">{error}</div>}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What to expect</CardTitle>
            <CardDescription>Fast and secure onboarding</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">
            <ul className="list-disc pl-4 space-y-2">
              <li>Email verification (instant)</li>
              <li>Identity verification (1–2 days)</li>
              <li>No hidden fees</li>
              <li>FDIC insured accounts</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
