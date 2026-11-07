// Shared navigation config + tiny inline icons (no icon library needed).

export const icons = {
  overview: 'M12 3 3 8l9 5 9-5-9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5',
  bills: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6M9 12h6',
  users: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm13 9v-1a4 4 0 0 0-3-3.87M16 4.13a3 3 0 0 1 0 5.75',
  items: 'M20 7 12 3 4 7v10l8 4 8-4V7Zm-8 4 8-4M12 11 4 7m8 4v10',
  insights: 'M4 20V10m6 10V4m6 16v-7m6 7H2',
  employees: 'M20 21v-2a4 4 0 0 0-3-3.87M4 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  profile: 'M3 21V8l9-5 9 5v13M9 21v-6h6v6M3 21h18',
  plus: 'M12 5v14M5 12h14',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  logout: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3',
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z',
};

export function Icon({ d, className = 'h-5 w-5' }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={d} />
    </svg>
  );
}

export type NavItem = { href: string; label: string; icon: string; ownerOnly?: boolean };

/** Sidebar / "More" menu items. */
export const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: icons.overview },
  { href: '/bills', label: 'Bills', icon: icons.bills },
  { href: '/customers', label: 'Customers', icon: icons.users },
  { href: '/items', label: 'My items', icon: icons.items },
  { href: '/insights', label: 'Insights', icon: icons.insights },
  { href: '/employees', label: 'Employees', icon: icons.employees },
  { href: '/profile', label: 'Profile', icon: icons.profile },
];

export function isActivePath(pathname: string, href: string) {
  if (href === '/bills') return pathname === '/bills' || (pathname.startsWith('/bills/') && pathname !== '/bills/new');
  return pathname === href || pathname.startsWith(href + '/');
}
