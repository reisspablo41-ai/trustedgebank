import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Trust Edge Bank — Modern Digital Banking',
    short_name: 'Trust Edge',
    description:
      'Secure checking and savings accounts, instant transfers, bill pay and debit cards.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b4630',
    theme_color: '#0b4630',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
