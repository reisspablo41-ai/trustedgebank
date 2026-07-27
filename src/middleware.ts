import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { pathname } = request.nextUrl;

  // First check our custom session cookie (faster)
  const trustedgeSession = request.cookies.get('trustedge-session');
  let hasValidSession = false;

  if (trustedgeSession) {
    try {
      const sessionData = JSON.parse(trustedgeSession.value);
      hasValidSession = !!sessionData.userId;
      console.log('[Middleware] Found trustedge-session cookie:', {
        userId: sessionData.userId,
      });
    } catch {
      // Invalid cookie format
    }
  }

  // Also check Supabase session as fallback
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // User is authenticated if either check passes
  const isAuthenticated = hasValidSession || !!user;

  // Debug logging (remove in production)
  console.log('[Middleware]', {
    pathname,
    hasValidSession,
    hasUser: !!user,
    userId: user?.id,
    isAuthenticated,
    cookies: request.cookies.getAll().map((c) => c.name),
  });

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/kyc', '/admin'];
  const isProtectedRoute = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  // If trying to access protected route without auth
  if (isProtectedRoute && !isAuthenticated) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    redirectUrl.searchParams.set('redirect', pathname);
    console.log('[Middleware] Redirecting to login:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
  }

  // If logged in and trying to access signup page, redirect to dashboard
  if (isAuthenticated && pathname.startsWith('/auth/signup')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/kyc/:path*',
    '/admin/:path*',
    '/auth/:path*',
  ],
};
