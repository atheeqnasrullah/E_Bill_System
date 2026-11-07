'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatRs, formatRsShort } from '@/lib/format';
import { chart } from './theme';

const dayLabel = (ymd: string) =>
  new Date(ymd + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** Revenue per day for the last 30 days. */
export default function RevenueLineChart({ data, height = 224 }: { data: { date: string; total: number }[]; height?: number }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chart.line} stopOpacity={0.3} />
              <stop offset="100%" stopColor={chart.line} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={chart.grid} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={dayLabel}
            tick={{ fontSize: 11, fill: chart.tick }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis tickFormatter={formatRsShort} tick={{ fontSize: 11, fill: chart.tick }} tickLine={false} axisLine={false} width={48} />
          <Tooltip
            formatter={(v: number) => [formatRs(v), 'Revenue']}
            labelFormatter={(l: string) => dayLabel(l)}
            contentStyle={chart.tooltip}
            labelStyle={{ color: chart.tick }}
          />
          <Area type="monotone" dataKey="total" stroke={chart.line} strokeWidth={2} fill="url(#rev)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
