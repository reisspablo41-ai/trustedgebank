import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { SimpleToastProvider } from '@/components/ui/simple-toast';
import { ThemeProvider } from '@/components/theme-provider';
import { MainHeader } from '@/components/main-header';
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from '@/lib/site';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    // Pages set a bare title; the suffix is appended here.
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'finance',
  keywords: [
    'online banking',
    'digital bank',
    'checking account',
    'savings account',
    'money transfers',
    'bill payments',
    'debit card',
    'FDIC insured',
    'Trust Edge Bank',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    url: SITE_URL,
    title: 'Trust Edge Bank — Modern Digital Banking',
    description: SITE_DESCRIPTION,
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Trust Edge Bank — modern banking, built on trust',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trust Edge Bank — Modern Digital Banking',
    description: SITE_DESCRIPTION,
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  manifest: '/manifest.webmanifest',
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  icons: {
    // PNGs first for the tab icon: at 16/32px the hand-tuned mark
    // (thicker strokes, flat gold) stays legible where the full logo muddies.
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/trust-edge-logo.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon-32x32.png',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
};

/** themeColor lives on `viewport`, not `metadata`, since Next 14. */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#127a52' },
    { media: '(prefers-color-scheme: dark)', color: '#0b4630' },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider defaultTheme="system" storageKey="trustedge-theme">
          <AuthProvider>
            <SimpleToastProvider>
              <div className="min-h-dvh flex flex-col">
                <MainHeader />
                <main className="flex-1">{children}</main>
                <footer className="border-t" id="global-footer">
                  <div className="mx-auto w-full max-w-6xl px-6 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                      <div>
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/trust-edge-logo.svg"
                            alt="Trust Edge Bank"
                            className="h-7 w-7 rounded-md object-cover"
                          />
                          <span className="text-sm font-semibold">
                            Trust Edge Bank
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground max-w-xs">
                          Trust Edge Bank, N.A. Member FDIC. Equal Housing Lender.
                        </p>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium mb-2">Company</div>
                        <ul className="space-y-2 text-muted-foreground">
                          <li>
                            <a className="hover:text-foreground" href="/about">
                              About
                            </a>
                          </li>
                          <li>
                            <a
                              className="hover:text-foreground"
                              href="/testimonials"
                            >
                              Testimonials
                            </a>
                          </li>
                          <li>
                            <a
                              className="hover:text-foreground"
                              href="/careers"
                            >
                              Careers
                            </a>
                          </li>
                          <li>
                            <a
                              className="hover:text-foreground"
                              href="/services"
                            >
                              Services
                            </a>
                          </li>
                        </ul>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium mb-2">Support</div>
                        <ul className="space-y-2 text-muted-foreground">
                          <li>
                            <a
                              className="hover:text-foreground"
                              href="/contact"
                            >
                              Contact
                            </a>
                          </li>
                          <li>
                            <a className="hover:text-foreground" href="/faq">
                              FAQ
                            </a>
                          </li>
                          <li>
                            <a className="hover:text-foreground" href="#">
                              Status
                            </a>
                          </li>
                        </ul>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium mb-2">Legal</div>
                        <ul className="space-y-2 text-muted-foreground">
                          <li>
                            <a
                              className="hover:text-foreground"
                              href="/legal/privacy"
                            >
                              Privacy Policy
                            </a>
                          </li>
                          <li>
                            <a
                              className="hover:text-foreground"
                              href="/legal/terms"
                            >
                              Terms & Conditions
                            </a>
                          </li>
                          <li>
                            <a
                              className="hover:text-foreground"
                              href="/legal/cookie"
                            >
                              Cookie Policy
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-8 text-xs text-muted-foreground">
                      © {new Date().getFullYear()} Trust Edge Bank. All rights
                      reserved.
                    </div>
                  </div>
                </footer>
              </div>
            </SimpleToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
