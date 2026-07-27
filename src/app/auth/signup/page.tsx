'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supbaseClient';
import { getAuthRedirectOrigin } from '@/lib/site';
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
import { Badge } from '@/components/ui/badge';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const { data, error: signErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          // Without this the confirmation link falls back to the dashboard
          // "Site URL", which sends production users to localhost.
          emailRedirectTo: `${getAuthRedirectOrigin()}/auth/callback`,
        },
      });
      if (signErr) throw signErr;
      const user = data.user;
      if (!user) throw new Error('Sign up failed');

      // User creation is handled by database trigger on auth.users
      // ensuring bank_users profile is created automatically.

      // Send welcome email
      try {
        await fetch('/api/emails/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            userName: fullName,
          }),
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }

      setMessage('Check your email to verify your account.');
      router.push('/auth/verify');
    } catch (err: any) {
      console.error('❌ Signup error:', err);
      console.error('❌ Error message:', err?.message);
      console.error('❌ Error details:', JSON.stringify(err, null, 2));
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
      <Badge className="mb-4">Create account</Badge>
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
        Sign up
      </h1>
      <p className="mt-2 text-muted-foreground">
        Open a Trust Edge Bank account in minutes.
      </p>
      <div className="mt-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Get started</CardTitle>
            <CardDescription>
              Verify your email to continue to KYC
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form className="grid gap-4" onSubmit={onSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <div className="text-sm text-red-600">{error}</div>}
              {message && (
                <div className="text-sm text-green-700">{message}</div>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create account'}
              </Button>
              <div className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <a className="text-primary hover:underline" href="/auth/login">
                  Log in
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
