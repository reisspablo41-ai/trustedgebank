'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supbaseClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function VerifyPendingPage() {
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const resendVerification = async () => {
    setResending(true);
    setMessage(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setMessage('No user found. Please sign up again.');
        return;
      }
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email!,
      });
      if (error) throw error;
      setMessage('Verification email resent! Check your inbox.');
    } catch (err: any) {
      setMessage(err.message ?? 'Failed to resend');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
      <Badge className="mb-4">Verify email</Badge>
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
        Check your inbox
      </h1>
      <div className="mt-8 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Confirm your email</CardTitle>
            <CardDescription>
              Click the verification link we sent to proceed
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground space-y-4">
            <p>
              We sent a verification email. After confirming your email, you can
              proceed to upload identity documents for KYC review.
            </p>
            <p>
              Didn&apos;t receive the email? Check your spam folder or click
              below to resend.
            </p>
            <div>
              <Button
                onClick={resendVerification}
                disabled={resending}
                variant="outline"
                size="sm"
              >
                {resending ? 'Resending...' : 'Resend verification email'}
              </Button>
            </div>
            {message && (
              <div className="text-sm text-primary font-medium">{message}</div>
            )}
            <p className="text-xs">
              Once verified, go to{' '}
              <a href="/kyc" className="text-primary hover:underline">
                KYC submission
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
