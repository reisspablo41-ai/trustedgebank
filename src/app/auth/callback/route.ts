import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set(name, '', options);
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Callback error:', error);
      return NextResponse.redirect(
        new URL('/auth/login?error=verification_failed', request.url)
      );
    }

    // After email verification, get user and check KYC status
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: bankUser } = await supabase
        .from('bank_users')
        .select('kyc_status')
        .eq('id', user.id)
        .single();

      const kycStatus = bankUser?.kyc_status ?? 'pending';

      // Redirect based on KYC status
      if (kycStatus === 'pending') {
        return NextResponse.redirect(new URL('/kyc', request.url));
      } else if (kycStatus === 'approved') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/kyc/status', request.url));
      }
    }
  }

  // Fallback redirect - new users should go to KYC, not dashboard
  return NextResponse.redirect(new URL('/kyc', request.url));
}
