import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDate, formatRs } from '@/lib/format';
import { formatLkPhone, phoneSearchFragment } from '@/lib/phone';
import type { CustomerSummary } from '@/lib/types';

export const metadata = { title: 'Customers' };

const clean = (s: string) => s.replace(/[,()%*\\":]/g, '').trim();

export default async function CustomersPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = createClient();
  const q = clean(searchParams.q ?? '');

  // customer_summaries is a view: one row per phone number with bill count,
  // total spent and last purchase date (see the SQL migration).
  let query = supabase
    .from('customer_summaries')
    .select('*')
    .order('last_purchase', { ascending: false, nullsFirst: false })
    .limit(200);

  if (q) {
    const frag = phoneSearchFragment(q);
    query = query.or([`name.ilike.%${q}%`, frag ? `phone.ilike.%${frag}%` : null].filter(Boolean).join(','));
  }

  const { data, error } = await query;
  const customers = (data ?? []) as CustomerSummary[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Customers</h1>
        <a href="/api/export/customers" className="text-sm font-medium text-brand-700">
          Export CSV
        </a>
      </div>

      <form action="/customers" className="flex gap-2">
        <input name="q" type="search" defaultValue={q} placeholder="Search phone or name" className="input" />
        <button className="btn-primary" type="submit">
          Search
        </button>
      </form>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error.message}</p>}

      {customers.length === 0 ? (
        <div className="card py-10 text-center text-slate-600">
          {q ? 'No customers match your search.' : 'Customers appear here after you create bills.'}
        </div>
      ) : (
        <ul className="card divide-y divide-slate-100 p-0">
          {customers.map((c) => (
            <li key={c.id}>
              <Link href={`/customers/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{c.name || formatLkPhone(c.phone)}</p>
                  {c.name && <p className="text-sm text-slate-600">{formatLkPhone(c.phone)}</p>}
                  <p className="text-xs text-slate-400">
                    {c.bill_count} bill{c.bill_count === 1 ? '' : 's'}
                    {c.last_purchase ? ` · last ${formatDate(c.last_purchase)}` : ''}
                  </p>
                </div>
                <p className="shrink-0 font-bold tabular-nums">{formatRs(c.total_spent)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
