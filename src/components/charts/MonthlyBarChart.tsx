'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatRs, formatRsShort } from '@/lib/format';
import { chart } from './theme';

const monthLabel = (ym: string) => new Date(ym + '-01T00:00:00').toLocaleDateString('en-GB', { month: 'short' });

/** Revenue by month for the last 6 months. */
export default function MonthlyBarChart({ data }: { data: { month: string; total: number; bills: number }[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke={chart.grid} vertical={false} />
          <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 12, fill: chart.tick }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={formatRsShort} tick={{ fontSize: 11, fill: chart.tick }} tickLine={false} axisLine={false} width={48} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            formatter={(v: number, _n, p) => [`${formatRs(v)} · ${(p.payload as { bills: number }).bills} bills`, '']}
            labelFormatter={(l: string) => new Date(l + '-01T00:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            separator=""
            contentStyle={chart.tooltip}
            labelStyle={{ color: chart.tick }}
          />
          <Bar dataKey="total" fill={chart.bar} radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
