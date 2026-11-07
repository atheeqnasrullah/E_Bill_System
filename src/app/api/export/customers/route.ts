import { createClient } from '@/lib/supabase/server';
import { csvResponse, toCsv } from '@/lib/csv';
import { formatDate } from '@/lib/format';
import { formatLkPhone } from '@/lib/phone';
import type { CustomerSummary } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET /api/export/customers → customers.csv (name, phone, bills, total spent, last purchase)
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const all: CustomerSummary[] = [];
  const PAGE = 1000;
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase
      .from('customer_summaries')
      .select('*')
      .order('total_spent', { ascending: false })
      .range(offset, offset + PAGE - 1);
    if (error) return new Response(error.message, { status: 500 });
    all.push(...((data ?? []) as CustomerSummary[]));
    if (!data || data.length < PAGE) break;
  }

  const csv = toCsv(
    ['Name', 'Phone', 'Bills', 'Total Spent', 'Last Purchase', 'Customer Since'],
    all.map((c) => [
      c.name ?? '',
      formatLkPhone(c.phone),
      c.bill_count,
      Number(c.total_spent).toFixed(2),
      c.last_purchase ? formatDate(c.last_purchase) : '',
      formatDate(c.created_at),
    ]),
  );

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(csv, `billbook-customers-${stamp}.csv`);
}
