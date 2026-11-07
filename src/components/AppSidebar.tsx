'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, NAV, icons, isActivePath } from './nav';
import { signOut } from '@/app/(auth)/actions';

/** Left sidebar shown on tablets/laptops (hidden on phones). */
export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-20 space-y-1">
      {NAV.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active ? 'bg-slate-100 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Icon d={item.icon} className="h-[18px] w-[18px]" />
            {item.label}
          </Link>
        );
      })}
      <form action={signOut} className="pt-4">
        <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900">
          <Icon d={icons.logout} className="h-[18px] w-[18px]" />
          Logout
        </button>
      </form>
    </nav>
  );
}
