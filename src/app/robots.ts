import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/** Signed-in and operational areas are disallowed here rather than via a
 *  per-page `noindex`, because those routes are all client components and
 *  cannot export metadata. */
const PRIVATE_PATHS = [
  '/admin',
  '/dashboard',
  '/auth',
  '/kyc',
  '/settings',
  '/debug',
  '/api',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: PRIVATE_PATHS.map((p) => `${p}/`),
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
