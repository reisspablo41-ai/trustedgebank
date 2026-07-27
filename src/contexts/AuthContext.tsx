'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supbaseClient';

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      // Sync to localStorage and cookie
      if (currentUser && session) {
        localStorage.setItem(
          'trustedge_user_session',
          JSON.stringify({
            id: currentUser.id,
            email: currentUser.email,
            timestamp: Date.now(),
          })
        );
        // Set cookie for middleware
        document.cookie = `trustedge-session=${JSON.stringify({
          userId: currentUser.id,
          accessToken: session.access_token,
        })};path=/;max-age=3600;SameSite=Lax`;
      } else {
        localStorage.removeItem('trustedge_user_session');
        localStorage.removeItem('trustedge_user');
        // Clear cookie
        document.cookie = 'trustedge-session=;path=/;max-age=0';
      }

      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      // Sync to localStorage and cookie on auth change
      if (currentUser && session) {
        localStorage.setItem(
          'trustedge_user_session',
          JSON.stringify({
            id: currentUser.id,
            email: currentUser.email,
            timestamp: Date.now(),
          })
        );
        // Set cookie for middleware
        document.cookie = `trustedge-session=${JSON.stringify({
          userId: currentUser.id,
          accessToken: session.access_token,
        })};path=/;max-age=3600;SameSite=Lax`;
      } else {
        localStorage.removeItem('trustedge_user_session');
        localStorage.removeItem('trustedge_user');
        // Clear cookie
        document.cookie = 'trustedge-session=;path=/;max-age=0';
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
