'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supbaseClient';
import {
  LayoutDashboard,
  Users,
  Wallet,
  DollarSign,
  ArrowLeftRight,
  FileText,
  Bell,
  Settings,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Accounts', href: '/admin/accounts', icon: Wallet },
  { name: 'Refunds', href: '/admin/refunds', icon: DollarSign },
  { name: 'Transactions', href: '/admin/transactions', icon: ArrowLeftRight },
  { name: 'Reports', href: '/admin/reports', icon: FileText },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    checkAdminAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdminAccess = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log('🔍 Admin check - User:', user?.email, 'ID:', user?.id);

      if (!user) {
        console.log('❌ No user found, redirecting to login');
        window.location.href = '/auth/login';
        return;
      }

      // Specific admin user ID
      const ADMIN_USER_ID = '68b77735-6ff7-47c4-a30d-f007cf67371b';

      // Check if user is the specific admin OR has admin role in user_roles table
      const isSpecificAdmin = user.id === ADMIN_USER_ID;

      console.log('🎯 Admin check:', {
        userId: user.id,
        adminUserId: ADMIN_USER_ID,
        isSpecificAdmin,
      });

      if (!isSpecificAdmin) {
        // Check user_roles table as backup
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        const hasAdminRole =
          roleData?.role &&
          ['admin', 'super_admin'].includes(roleData.role.toLowerCase().trim());

        console.log('📋 Role check:', { roleData, hasAdminRole });

        if (!hasAdminRole) {
          console.log('❌ Access denied - not admin user');
          window.location.href = '/dashboard';
          return;
        }
      }

      console.log('✅ Admin access granted');

      // Get admin name from bank_users if exists, otherwise use email
      const { data: userData } = await supabase
        .from('bank_users')
        .select('full_name')
        .eq('id', user.id)
        .single();

      setAdminName(userData?.full_name || user.email?.split('@')[0] || 'Admin');
      setLoading(false);
    } catch (error) {
      console.error('Admin access check error:', error);
      window.location.href = '/dashboard';
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = 'trustedge-session=; Max-Age=0; path=/;';
    localStorage.removeItem('trustedge-auth');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-card border-r transform transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/trust-edge-logo.svg"
                alt="Trust Edge Bank"
                className="h-8 w-8 rounded-md object-cover"
              />
              <span className="font-semibold">Admin Panel</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Admin info & logout */}
          <div className="p-4 border-t">
            <div className="mb-3">
              <p className="text-sm font-medium">{adminName}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
          <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1 lg:flex-none">
              <h1 className="text-lg font-semibold">
                {navigation.find((item) => pathname === item.href)?.name ||
                  'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  View Site
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
