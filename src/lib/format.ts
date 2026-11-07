// Display helpers: money and dates. Everything shows in Sri Lanka time.

export const TIME_ZONE = 'Asia/Colombo';

const moneyFmt = new Intl.NumberFormat('en-LK', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 1250 → "Rs. 1,250.00" */
export function formatRs(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number(value) : value ?? 0;
  return 'Rs. ' + moneyFmt.format(Number.isFinite(n) ? n : 0);
}

/** Compact money for chart axes: 12500 → "12.5k" */
export function formatRsShort(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(Math.round(n));
}

/** "08 Nov 2026, 3:45 pm" */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

/** "08 Nov 2026" */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

/** Quantity without trailing zeros: "2.000" → "2", "1.500" → "1.5" */
export function formatQty(q: number | string): string {
  return String(Number(q));
}

/**
 * Turn a "YYYY-MM-DD" date picked in Sri Lanka into an ISO timestamp
 * for the start of that day (Sri Lanka is always UTC+05:30, no DST).
 */
export function colomboDayStart(ymd: string): string {
  return `${ymd}T00:00:00+05:30`;
}

/** Start of the day AFTER ymd (use with "less than" for an inclusive end date). */
export function colomboNextDayStart(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00+05:30`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}

export function isYmd(s: string | undefined | null): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
