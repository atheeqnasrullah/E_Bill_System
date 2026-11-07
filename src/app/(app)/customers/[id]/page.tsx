import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatDate, formatDateTime, formatRs } from '@/lib/format';
import { formatLkPhone } from '@/lib/phone';
import type { CustomerSummary } from '@/lib/types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata = { title: 'Customer' };

export default async function CustomerPage({ params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) notFound();
  const supabase = createClient();

  const [{ data: summary }, { data: bills }] = await Promise.all([
    supabase.from('customer_summaries').select('*').eq('id', params.id).maybeSingle(),
    supabase
      .from('bills')
      .select('id, bill_number, total, created_at')
      .eq('customer_id', params.id)
      .order('created_at', { ascending: false })
      .limit(500),
  ]);

  if (!summary) notFound();
  const c = summary as CustomerSummary;
  const local = formatLkPhone(c.phone).replace(/\s/g, '');

  return (
    <div className="space-y-4">
      <Link href="/customers" className="text-sm font-medium text-slate-600">
        ← All customers
      </Link>

      <div className="card">
        <h1 className="text-2xl font-bold">{c.name || 'No name'}</h1>
        <a href={`tel:${c.phone}`} className="text-brand-700">
          {formatLkPhone(c.phone)}
        </a>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Bills</p>
            <p className="text-lg font-bold">{c.bill_count}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Total spent</p>
            <p className="text-sm font-bold">{formatRs(c.total_spent)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Last visit</p>
            <p className="text-sm font-bold">{c.last_purchase ? formatDate(c.last_purchase) : '—'}</p>
          </div>
        </div>
      </div>

      <Link href={`/bills/new?phone=${local}`} className="btn-primary w-full">
        + New bill for this customer
      </Link>

      <h2 className="font-semibold text-slate-700">Bills</h2>
      {!bills || bills.length === 0 ? (
        <div className="card py-8 text-center text-slate-600">No bills yet.</div>
      ) : (
        <ul className="card divide-y divide-slate-100 p-0">
          {bills.map((b) => (
            <li key={b.id}>
              <Link href={`/bills/${b.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                <div>
                  <p className="font-semibold">{b.bill_number}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(b.created_at)}</p>
                </div>
                <p className="font-bold tabular-nums">{formatRs(b.total)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
