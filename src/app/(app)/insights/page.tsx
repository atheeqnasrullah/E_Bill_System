import Link from 'next/link';
import MonthlyBarChart from '@/components/charts/MonthlyBarChart';
import RevenueLineChart from '@/components/charts/RevenueLineChart';
import WeekdayBarChart from '@/components/charts/WeekdayBarChart';
import StatCard from '@/components/StatCard';
import { createClient } from '@/lib/supabase/server';
import { formatRs } from '@/lib/format';
import { formatLkPhone } from '@/lib/phone';
import type { DashboardStats } from '@/lib/types';

export const metadata = { title: 'Insights' };

export default async function InsightsPage() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('dashboard_stats');
  const stats = data as DashboardStats | null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Insights</h1>
        <p className="text-sm text-slate-500">How your shop is doing over time.</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error.message}</p>}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="All-time revenue" value={formatRs(stats.all_time_sales ?? 0)} />
            <StatCard label="This month" value={formatRs(stats.month_sales)} />
            <StatCard label="Total bills" value={String(stats.total_bills)} hint={`Avg ${formatRs(stats.avg_bill ?? 0)}`} />
            <StatCard label="Customers" value={String(stats.total_customers)} />
          </div>

          {stats.monthly_revenue && (
            <section className="card">
              <h2 className="mb-2 font-semibold">Revenue by month · last 6 months</h2>
              <MonthlyBarChart data={stats.monthly_revenue} />
            </section>
          )}

          <section className="card">
            <h2 className="mb-2 font-semibold">Daily revenue · last 30 days</h2>
            <RevenueLineChart data={stats.daily_revenue ?? []} />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card">
              <h2 className="mb-2 font-semibold">Busiest days</h2>
              <WeekdayBarChart data={stats.weekday ?? []} />
            </section>

            <section className="card p-0">
              <h2 className="px-4 pt-4 font-semibold">Top customers</h2>
              {stats.top_customers.length === 0 ? (
                <p className="px-4 py-6 text-sm text-slate-500">No customers yet.</p>
              ) : (
                <ol className="mt-2 divide-y divide-slate-100">
                  {stats.top_customers.map((c, i) => (
                    <li key={c.id}>
                      <Link href={`/customers/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{c.name || formatLkPhone(c.phone)}</p>
                          <p className="text-xs text-slate-400">
                            {c.bills} bill{c.bills === 1 ? '' : 's'}
                          </p>
                        </div>
                        <p className="font-bold tabular-nums">{formatRs(c.total)}</p>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
