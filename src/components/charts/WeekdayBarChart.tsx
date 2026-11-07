'use client';

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatRs } from '@/lib/format';
import { chart } from './theme';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Number of bills per weekday; the busiest day is highlighted. */
export default function WeekdayBarChart({ data }: { data: { dow: number; bills: number; total: number }[] }) {
  // Show Monday first, the way shops think about the week.
  const ordered = [1, 2, 3, 4, 5, 6, 0].map((d) => data.find((x) => x.dow === d) ?? { dow: d, bills: 0, total: 0 });
  const max = Math.max(...ordered.map((d) => d.bills));
  const rows = ordered.map((d) => ({ ...d, day: DAYS[d.dow] }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke={chart.grid} vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: chart.tick }} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: chart.tick }} tickLine={false} axisLine={false} width={40} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            formatter={(v: number, _n, p) => [`${v} bills · ${formatRs((p.payload as { total: number }).total)}`, '']}
            separator=""
            contentStyle={chart.tooltip}
            labelStyle={{ color: chart.tick }}
          />
          <Bar dataKey="bills" radius={[6, 6, 0, 0]} maxBarSize={36}>
            {rows.map((r) => (
              <Cell key={r.dow} fill={max > 0 && r.bills === max ? chart.bar : chart.barMuted} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
