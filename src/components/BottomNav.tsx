'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, icons, isActivePath } from './nav';

const items = [
  { href: '/dashboard', label: 'Home', icon: icons.home },
  { href: '/bills', label: 'Bills', icon: icons.bills },
  { href: '/bills/new', label: 'New', icon: icons.plus, primary: true },
  { href: '/customers', label: 'Customers', icon: icons.users },
  { href: '/more', label: 'More', icon: icons.more },
];

// Pages reachable from the "More" tab, so it stays highlighted there.
const MORE_PATHS = ['/more', '/items', '/insights', '/employees', '/profile'];

/** Bottom navigation for phones (hidden on bigger screens, which use the sidebar). */
export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/more' ? MORE_PATHS.some((p) => isActivePath(pathname, p)) : isActivePath(pathname, href);

  return (
    <nav className="no-print pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-card/95 backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-2xl grid-cols-5">
        {items.map((item) => {
          if (item.primary) {
            return (
              <li key={item.href} className="flex justify-center">
                <Link
                  href={item.href}
                  className="-mt-5 flex h-16 w-16 flex-col items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 ring-4 ring-slate-50 active:scale-95"
                  aria-label="New bill"
                >
                  <Icon d={item.icon} className="h-7 w-7" />
                  <span className="text-[10px] font-semibold">New</span>
                </Link>
              </li>
            );
          }
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium ${
                  active ? 'text-brand-700' : 'text-slate-500'
                }`}
              >
                <Icon d={item.icon} className="h-6 w-6" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
