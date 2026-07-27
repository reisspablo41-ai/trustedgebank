'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/UserMenu';
import { MainNavMobile } from '@/components/main-nav-mobile';
import { useAuth } from '@/contexts/AuthContext';

const navigationItems = [
  {
    name: 'Personal',
    submenu: [
      { name: 'Checking Accounts', href: '/accounts/compare' },
      { name: 'Savings Accounts', href: '/accounts/compare' },
      { name: 'Loans & Mortgages', href: '/loans/rates' },
      { name: 'Transfers', href: '/services/transfers' },
    ],
  },
  {
    name: 'Services',
    href: '/services',
    submenu: [
      { name: 'All Services', href: '/services' },
      { name: 'Online Banking', href: '/services' },
      { name: 'Mobile App', href: '/mobile-app' },
      { name: 'Card Services', href: '/services/cards' },
    ],
  },
  {
    name: 'About',
    href: '/about',
    submenu: [
      { name: 'About Us', href: '/about' },
      { name: 'Branch Locations', href: '/about/branches' },
      { name: 'Testimonials', href: '/testimonials' },
      { name: 'Careers', href: '/careers' },
      { name: 'Customer Stories', href: '/' },
    ],
  },
  {
    name: 'Support',
    submenu: [
      { name: 'Contact Us', href: '/contact' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Help Center', href: '/contact' },
    ],
  },
];

export function MainHeader() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/trust-edge-logo.svg"
              alt="Trust Edge Bank"
              className="h-8 w-8 rounded-md object-cover"
            />
            <span className="text-base font-semibold tracking-tight">
              Trust Edge Bank
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => (
              <div key={item.name} className="relative group">
                {item.href ? (
                  <Link href={item.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {item.name}
                      {item.submenu && <ChevronDown className="ml-1 h-3 w-3" />}
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {item.name}
                    {item.submenu && <ChevronDown className="ml-1 h-3 w-3" />}
                  </Button>
                )}

                {/* Desktop Dropdown */}
                {item.submenu && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-background border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-2">
                      {item.submenu.map((subItem) => (
                        <Link key={subItem.name} href={subItem.href}>
                          <button className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                            {subItem.name}
                          </button>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Desktop: Show auth buttons when logged out */}
            {!user && (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/open-account">
                  <Button size="sm">Open Account</Button>
                </Link>
              </div>
            )}

            {/* User Menu (only when logged in) */}
            {user && <UserMenu />}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <MainNavMobile
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isLoggedIn={!!user}
      />
    </header>
  );
}
