import type { MetadataRoute } from 'next';

// PWA manifest (served at /manifest.webmanifest) → "Add to Home screen".
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BillBook',
    short_name: 'BillBook',
    description: 'Digital bill book for small shops',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#059669',
    orientation: 'portrait',
    icons: [
      { src: '/icons/192', sizes: '192x192', type: 'image/png' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
