import Link from 'next/link';
import RevenueLineChart from '@/components/charts/RevenueLineChart';
import StatCard from '@/components/StatCard';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/business';
import { formatDateTime, formatRs } from '@/lib/format';
import { formatLkPhone } from '@/lib/phone';
import type { DashboardStats } from '@/lib/types';

export const metadata = { title: 'Overview' };

type RecentBill = {
  id: string;
  bill_number: string;
  total: number;
  created_at: string;
  customers: { name: string | null; phone: string } | null;
};

export default async function OverviewPage() {
  const { business } = await requireBusiness();
  const supabase = createClient();

  // One database call for all numbers (dashboard_stats), plus recent bills.
  const [{ data: statsData, error }, { data: recent }] = await Promise.all([
    supabase.rpc('dashboard_stats'),
    supabase
      .from('bills')
      .select('id, bill_number, total, created_at, customers(name, phone)')
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  const stats = statsData as DashboardStats | null;
  const recentBills = (recent ?? []) as unknown as RecentBill[];
  const noBills = !stats || stats.total_bills === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="page-title truncate">{business.name}</h1>
          <p className="text-sm text-slate-500">Your business, at a glance.</p>
        </div>
        <Link href="/bills/new" className="btn-primary shrink-0 md:hidden">
          + New bill
        </Link>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error.message}</p>}

      {noBills ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">🧾</div>
          <h2 className="text-lg font-semibold">No bills yet</h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Create your first bill. Your sales, customers and insights will build up here as you go.
          </p>
          <Link href="/bills/new" className="btn-primary mt-6">
            Create your first bill
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              highlight
              className="col-span-2"
              label="Today's sales"
              value={formatRs(stats.today_sales)}
              hint={`${stats.today_bills} bill${stats.today_bills === 1 ? '' : 's'} today`}
            />
            <StatCard
              label="This month"
              value={formatRs(stats.month_sales)}
              hint={stats.month_bills !== undefined ? `${stats.month_bills} bills` : undefined}
            />
            <StatCard label="Total bills" value={String(stats.total_bills)} hint={`${stats.total_customers} customers`} />
          </div>

          <section className="card">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold">Revenue · last 30 days</h2>
              <Link href="/insights" className="text-sm font-medium text-brand-700">
                Insights →
              </Link>
            </div>
            <RevenueLineChart data={stats.daily_revenue ?? []} height={180} />
          </section>

          <section className="card p-0">
            <div className="flex items-center justify-between px-4 pt-4">
              <h2 className="font-semibold">Recent bills</h2>
              <Link href="/bills" className="text-sm font-medium text-brand-700">
                See all
              </Link>
            </div>
            <ul className="mt-2 divide-y divide-slate-100">
              {recentBills.map((b) => (
                <li key={b.id}>
                  <Link href={`/bills/${b.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-100">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        <span className="font-mono text-sm">{b.bill_number}</span>{' '}
                        <span className="text-slate-500">· {b.customers?.name || formatLkPhone(b.customers?.phone)}</span>
                      </p>
                      <p className="text-xs text-slate-400">{formatDateTime(b.created_at)}</p>
                    </div>
                    <p className="shrink-0 font-bold tabular-nums">{formatRs(b.total)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
