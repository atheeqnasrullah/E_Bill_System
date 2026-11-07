import Link from 'next/link';
import AppSidebar from '@/components/AppSidebar';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import { requireBusiness } from '@/lib/business';

// Layout for every logged-in page. Requires a session AND a business profile.
// Phones: top bar + bottom navigation. Laptops: top bar + left sidebar.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { business } = await requireBusiness();

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-20 border-b border-slate-200 bg-slate-50/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Logo href="/dashboard" />
          <div className="flex items-center gap-3">
            <span className="hidden max-w-[200px] truncate text-sm text-slate-500 sm:block">{business.name}</span>
            <Link href="/bills/new" className="hidden rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 md:inline-flex">
              + New bill
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-8 px-4">
        <aside className="no-print hidden w-52 shrink-0 pt-6 md:block">
          <AppSidebar />
        </aside>
        <main className="min-w-0 max-w-3xl flex-1 pb-28 pt-6 md:pb-16">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
}
