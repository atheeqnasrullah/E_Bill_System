/** Small number tile used on Overview and Insights. */
export default function StatCard({
  label,
  value,
  hint,
  highlight = false,
  className = '',
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div className={`card ${highlight ? 'border-brand-600/40 bg-gradient-to-br from-brand-600/25 to-card' : ''} ${className}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 font-bold tabular-nums text-slate-900 ${highlight ? 'text-3xl' : 'text-xl'}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
