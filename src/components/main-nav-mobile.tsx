'use client';

import Link from 'next/link';
import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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

interface MainNavMobileProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
}

export function MainNavMobile({
  isOpen,
  onClose,
  isLoggedIn,
}: MainNavMobileProps) {
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const toggleSubmenu = (name: string) => {
    setOpenSubmenu(openSubmenu === name ? null : name);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay with fade animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-[100] md:hidden"
            onClick={onClose}
          />

          {/* Slide-in Menu from Right with smooth animation */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 h-screen w-80 bg-background border-l shadow-xl z-[110] md:hidden flex flex-col overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation Items */}
            <nav className="flex flex-col p-4 space-y-1 flex-1">
              {navigationItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  {item.href && !item.submenu ? (
                    <Link href={item.href} onClick={onClose}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-base"
                      >
                        {item.name}
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        className="w-full justify-between text-base"
                        onClick={() => toggleSubmenu(item.name)}
                      >
                        {item.name}
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 transition-transform',
                            openSubmenu === item.name && 'rotate-180'
                          )}
                        />
                      </Button>

                      {/* Submenu */}
                      {item.submenu && openSubmenu === item.name && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              onClick={onClose}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-sm text-muted-foreground"
                              >
                                {subItem.name}
                              </Button>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              ))}

              {/* Quick Links - Only show when logged out */}
              {!isLoggedIn && (
                <div className="pt-4 border-t mt-4">
                  <Link href="/open-account" onClick={onClose}>
                    <Button className="w-full mb-2">Open Account</Button>
                  </Link>
                  <Link href="/auth/login" onClick={onClose}>
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
