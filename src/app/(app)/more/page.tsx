import Link from 'next/link';
import { Icon, NAV, icons } from '@/components/nav';
import { signOut } from '@/app/(auth)/actions';
import { requireBusiness } from '@/lib/business';

export const metadata = { title: 'More' };

// Phone-only menu: everything that does not fit in the bottom bar.
export default async function MorePage() {
  const { business, email, role } = await requireBusiness();
  const extra = NAV.filter((n) => ['/items', '/insights', '/employees', '/profile'].includes(n.href));

  return (
    <div className="space-y-4">
      <div className="card">
        <p className="text-lg font-bold">{business.name}</p>
        <p className="text-sm text-slate-500">
          {email} · {role === 'owner' ? 'Owner' : 'Employee'}
        </p>
      </div>

      <ul className="card divide-y divide-slate-100 p-0">
        {extra.map((n) => (
          <li key={n.href}>
            <Link href={n.href} className="flex items-center gap-3 px-4 py-4 font-medium hover:bg-slate-100">
              <Icon d={n.icon} className="h-5 w-5 text-slate-500" />
              {n.label}
              <span className="ml-auto text-slate-400">›</span>
            </Link>
          </li>
        ))}
      </ul>

      <form action={signOut}>
        <button type="submit" className="btn-danger w-full">
          <Icon d={icons.logout} />
          Logout
        </button>
      </form>
    </div>
  );
}
