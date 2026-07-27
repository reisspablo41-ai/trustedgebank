'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

type KycStatus = {
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  identification_type: string;
  identification_number: string;
};

export default function KycStatusPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [bankUserStatus, setBankUserStatus] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStatus = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    // Get bank user KYC status
    const { data: bankUser } = await supabase
      .from('bank_users')
      .select('kyc_status')
      .eq('id', user.id)
      .single();

    setBankUserStatus(bankUser?.kyc_status ?? 'pending');

    // Get latest KYC submission
    const { data: kyc } = await supabase
      .from('kyc_submissions')
      .select(
        'status, submitted_at, reviewed_at, identification_type, identification_number'
      )
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single();

    setKycStatus(kyc as KycStatus | null);
    setLoading(false);
  };

  if (loading) return null;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
      <Badge className="mb-4">KYC Status</Badge>
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
        Identity verification status
      </h1>
      <div className="mt-8 max-w-xl">
        {!kycStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">No submission found</CardTitle>
              <CardDescription>
                You haven&apos;t submitted KYC yet
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button asChild>
                <a href="/kyc">Upload documents</a>
              </Button>
            </CardContent>
          </Card>
        )}

        {kycStatus?.status === 'pending' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="secondary">Pending</Badge> Under review
              </CardTitle>
              <CardDescription>
                Submitted{' '}
                {new Date(kycStatus.submitted_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              <p>
                We&apos;re reviewing your{' '}
                {kycStatus.identification_type.toUpperCase()} verification. This
                typically takes 1–2 business days. You&apos;ll receive an email
                when your verification is complete.
              </p>
            </CardContent>
          </Card>
        )}

        {kycStatus?.status === 'approved' && bankUserStatus === 'approved' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Badge>Approved</Badge> Identity verified
              </CardTitle>
              <CardDescription>
                Reviewed {new Date(kycStatus.reviewed_at!).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground space-y-4">
              <p>
                Your identity has been verified and your accounts are ready!
              </p>
              <Button asChild>
                <a href="/dashboard">Go to dashboard</a>
              </Button>
            </CardContent>
          </Card>
        )}

        {kycStatus?.status === 'rejected' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="destructive">Rejected</Badge> Resubmit required
              </CardTitle>
              <CardDescription>
                Reviewed {new Date(kycStatus.reviewed_at!).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground space-y-4">
              <p>
                We couldn&apos;t verify your identity with the documents
                provided. Common reasons: blurry photo, expired ID, unreadable
                text.
              </p>
              <p>Please upload clear, current documents and resubmit.</p>
              <Button asChild>
                <a href="/kyc">Resubmit documents</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
