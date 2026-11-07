import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { colomboDayStart, colomboNextDayStart, formatDateTime, formatRs, isYmd } from '@/lib/format';
import { formatLkPhone, phoneSearchFragment } from '@/lib/phone';

export const metadata = { title: 'Bills' };

const PAGE_SIZE = 30;

type Search = { q?: string; from?: string; to?: string; page?: string };

type BillRow = {
  id: string;
  bill_number: string;
  total: number;
  created_at: string;
  customers: { name: string | null; phone: string } | null;
};

/** Remove characters that have special meaning in PostgREST filters. */
const clean = (s: string) => s.replace(/[,()%*\\":]/g, '').trim();

export default async function BillsPage({ searchParams }: { searchParams: Search }) {
  const supabase = createClient();
  const q = clean(searchParams.q ?? '');
  const from = isYmd(searchParams.from) ? searchParams.from : '';
  const to = isYmd(searchParams.to) ? searchParams.to : '';
  const page = Math.max(1, Number(searchParams.page) || 1);

  let query = supabase
    .from('bills')
    .select('id, bill_number, total, created_at, customers(name, phone)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (from) query = query.gte('created_at', colomboDayStart(from));
  if (to) query = query.lt('created_at', colomboNextDayStart(to));

  if (q) {
    // Search bill number, OR customers whose phone/name matches.
    const frag = phoneSearchFragment(q);
    const custFilter = [`name.ilike.%${q}%`, frag ? `phone.ilike.%${frag}%` : null].filter(Boolean).join(',');
    const { data: custs } = await supabase.from('customers').select('id').or(custFilter).limit(200);
    const ids = (custs ?? []).map((c) => c.id);
    query = query.or([`bill_number.ilike.%${q}%`, ids.length ? `customer_id.in.(${ids.join(',')})` : null].filter(Boolean).join(','));
  }

  const { data, count, error } = await query;
  const bills = (data ?? []) as unknown as BillRow[];
  const total = count ?? 0;
  const hasFilters = !!(q || from || to);

  const pageLink = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (from) sp.set('from', from);
    if (to) sp.set('to', to);
    sp.set('page', String(p));
    return `/bills?${sp}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Bills</h1>
        <a href={`/api/export/bills${from || to ? `?from=${from}&to=${to}` : ''}`} className="text-sm font-medium text-brand-700">
          Export CSV
        </a>
      </div>

      {/* GET form: filters live in the URL, so they survive refresh and back button. */}
      <form className="card space-y-3" action="/bills">
        <input name="q" defaultValue={q} placeholder="Search bill no, phone or name" className="input" type="search" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-500" htmlFor="from">
              From
            </label>
            <input id="from" name="from" type="date" defaultValue={from} className="input" />
          </div>
          <div>
            <label className="text-xs text-slate-500" htmlFor="to">
              To
            </label>
            <input id="to" name="to" type="date" defaultValue={to} className="input" />
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary flex-1" type="submit">
            Search
          </button>
          {hasFilters && (
            <Link href="/bills" className="btn-secondary">
              Clear
            </Link>
          )}
        </div>
      </form>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error.message}</p>}

      <p className="text-sm text-slate-500">
        {total} bill{total === 1 ? '' : 's'}
        {hasFilters ? ' found' : ''}
      </p>

      {bills.length === 0 ? (
        <div className="card py-10 text-center">
          <p className="text-slate-600">{hasFilters ? 'No bills match your search.' : 'No bills yet.'}</p>
          {!hasFilters && (
            <Link href="/bills/new" className="btn-primary mt-4">
              Create your first bill
            </Link>
          )}
        </div>
      ) : (
        <ul className="card divide-y divide-slate-100 p-0">
          {bills.map((b) => (
            <li key={b.id}>
              <Link href={`/bills/${b.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                <div className="min-w-0">
                  <p className="font-semibold">{b.bill_number}</p>
                  <p className="truncate text-sm text-slate-600">
                    {b.customers?.name || formatLkPhone(b.customers?.phone)}
                    {b.customers?.name && <span className="text-slate-400"> · {formatLkPhone(b.customers.phone)}</span>}
                  </p>
                  <p className="text-xs text-slate-400">{formatDateTime(b.created_at)}</p>
                </div>
                <p className="shrink-0 font-bold tabular-nums">{formatRs(b.total)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          {page > 1 ? (
            <Link href={pageLink(page - 1)} className="btn-secondary">
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-slate-500">
            Page {page} of {Math.ceil(total / PAGE_SIZE)}
          </span>
          {page * PAGE_SIZE < total ? (
            <Link href={pageLink(page + 1)} className="btn-secondary">
              Older →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
