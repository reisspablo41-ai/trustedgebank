'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supbaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DebugAuthPage() {
  const [session, setSession] = useState<unknown>(null);
  const [user, setUser] = useState<unknown>(null);
  const [cookies, setCookies] = useState<string>('');

  useEffect(() => {
    checkAuth();
    // Get cookies from document
    setCookies(document.cookie);
  }, []);

  const checkAuth = async () => {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    setSession(currentSession);
    setUser(currentUser);

    console.log('Session:', currentSession);
    console.log('User:', currentUser);
    console.log('Cookies:', document.cookie);
  };

  const testProtectedRoute = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <h1 className="text-2xl font-semibold mb-6">Auth Debug Page</h1>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-sm space-y-2">
              <div>
                <strong>Has Session:</strong> {session ? '✅ Yes' : '❌ No'}
              </div>
              <div>
                <strong>Has User:</strong> {user ? '✅ Yes' : '❌ No'}
              </div>
              {user ? (
                <>
                  <div>
                    <strong>User ID:</strong> {(user as any).id}
                  </div>
                  <div>
                    <strong>Email:</strong> {(user as any).email}
                  </div>
                  <div>
                    <strong>Email Confirmed:</strong>{' '}
                    {(user as any).email_confirmed_at ? '✅ Yes' : '❌ No'}
                  </div>
                </>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cookies</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xs font-mono bg-muted p-3 rounded-md break-all">
              {cookies || 'No cookies found'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <Button onClick={checkAuth} variant="outline" className="w-full">
              Refresh Auth Status
            </Button>
            <Button onClick={testProtectedRoute} className="w-full">
              Test Protected Route (/dashboard)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expected Cookies</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">
            <p>After login, you should see cookies like:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>sb-&lt;project-ref&gt;-auth-token</li>
              <li>Or similar Supabase auth cookies</li>
            </ul>
            <p className="mt-2">
              If cookies are missing, the session won&apos;t persist to
              middleware.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
