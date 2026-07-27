/** Shared site identity used by metadata, robots.ts and sitemap.ts.
 *
 *  SITE_URL is hardcoded rather than read from NEXT_PUBLIC_APP_URL so that
 *  canonical URLs and social card images never point at localhost. */
export const SITE_URL = 'https://www.trustedgebank.com';

export const SITE_NAME = 'Trust Edge Bank';

export const SITE_TITLE = 'Trust Edge Bank — Modern Digital Banking';

export const SITE_DESCRIPTION =
  'Trust Edge Bank offers secure checking and savings accounts, instant transfers, bill pay and debit cards, backed by 24/7 support. Open an account in minutes.';

/**
 * Origin that Supabase auth emails (confirm signup, password reset) should
 * link back to.
 *
 * Uses the live browser origin so a signup on production yields a production
 * link and a signup on localhost yields a localhost one. Without an explicit
 * redirect Supabase falls back to the dashboard "Site URL", which is a single
 * fixed value and is what causes production emails to point at localhost.
 *
 * Every origin returned here must also be listed under
 * Authentication → URL Configuration → Redirect URLs, or Supabase ignores it
 * and silently falls back to Site URL again.
 */
export function getAuthRedirectOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return SITE_URL;
}
