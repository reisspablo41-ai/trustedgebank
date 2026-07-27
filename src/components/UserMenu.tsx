'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supbaseClient';
import { useEffect, useState } from 'react';

export function UserMenu() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState<string>('');

  useEffect(() => {
    if (user) {
      // Get full name from bank_users or user metadata
      supabase
        .from('bank_users')
        .select('full_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          const name =
            data?.full_name ||
            user.user_metadata?.full_name ||
            user.email ||
            '';
          setFullName(name);
          // Store in localStorage
          localStorage.setItem(
            'trustedge_user',
            JSON.stringify({ id: user.id, email: user.email, fullName: name })
          );
        });
    } else {
      // Remove from localStorage when logged out
      localStorage.removeItem('trustedge_user');
    }
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('trustedge_user');
    localStorage.removeItem('trustedge_user_session');
    // Clear session cookie
    document.cookie = 'trustedge-session=;path=/;max-age=0';
    router.push('/');
  };

  if (loading) {
    return <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="hidden md:inline-flex"
        >
          <a href="/auth/login">Log in</a>
        </Button>
        <Button asChild size="sm">
          <a href="/open-account">Sign up</a>
        </Button>
      </div>
    );
  }

  const initials =
    fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ||
    user.email?.slice(0, 2).toUpperCase() ||
    'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus:outline-none focus:ring-2 focus:ring-ring/50 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{fullName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/dashboard')}>
          <User className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/kyc/status')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>KYC Status</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
