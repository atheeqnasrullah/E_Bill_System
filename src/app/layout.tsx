import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: { default: 'BillBook', template: '%s · BillBook' },
  description: 'Digital bill book for small shops in Sri Lanka.',
  applicationName: 'BillBook',
  appleWebApp: { capable: true, title: 'BillBook', statusBarStyle: 'default' },
  icons: { icon: '/icons/192', apple: '/icons/180' },
};

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
