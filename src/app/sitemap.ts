import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/** Public marketing routes only — anything under the paths disallowed in
 *  robots.ts is deliberately absent. */
const ROUTES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
}> = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/open-account', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/services', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/services/cards', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/services/transfers', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/accounts/compare', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/loans/rates', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/mobile-app', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/about/branches', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/about/team/jordan-lee', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/about/team/samira-khan', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/about/team/daniel-rossi', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/testimonials', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/stories/first-home-savings', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/stories/growing-small-business', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/learn-more', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/careers', priority: 0.5, changeFrequency: 'weekly' },
  { path: '/contact', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/legal/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/legal/terms', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/legal/cookie', priority: 0.3, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
