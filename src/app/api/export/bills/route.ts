import { createClient } from '@/lib/supabase/server';
import { csvResponse, toCsv } from '@/lib/csv';
import { colomboDayStart, colomboNextDayStart, formatDateTime, formatQty, isYmd } from '@/lib/format';
import { formatLkPhone } from '@/lib/phone';

export const dynamic = 'force-dynamic';

type Row = {
  bill_number: string;
  created_at: string;
  subtotal: number;
  discount: number;
  total: number;
  note: string | null;
  customers: { name: string | null; phone: string } | null;
  bill_items: { item_name: string; quantity: number; unit_price: number; position: number }[];
};

// GET /api/export/bills?from=YYYY-MM-DD&to=YYYY-MM-DD  → bills.csv
// Runs as the logged-in user, so RLS only returns their own bills.
export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const sp = new URL(request.url).searchParams;
  const from = sp.get('from');
  const to = sp.get('to');

  // Supabase returns max 1000 rows per request, so fetch in pages.
  const all: Row[] = [];
  const PAGE = 1000;
  for (let offset = 0; ; offset += PAGE) {
    let q = supabase
      .from('bills')
      .select('bill_number, created_at, subtotal, discount, total, note, customers(name, phone), bill_items(item_name, quantity, unit_price, position)')
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE - 1);
    if (isYmd(from)) q = q.gte('created_at', colomboDayStart(from));
    if (isYmd(to)) q = q.lt('created_at', colomboNextDayStart(to));

    const { data, error } = await q;
    if (error) return new Response(error.message, { status: 500 });
    all.push(...((data ?? []) as unknown as Row[]));
    if (!data || data.length < PAGE) break;
  }

  const csv = toCsv(
    ['Bill No', 'Date', 'Customer Name', 'Customer Phone', 'Items', 'Subtotal', 'Discount', 'Total', 'Note'],
    all.map((b) => [
      b.bill_number,
      formatDateTime(b.created_at),
      b.customers?.name ?? '',
      formatLkPhone(b.customers?.phone),
      [...b.bill_items]
        .sort((a, z) => a.position - z.position)
        .map((i) => `${i.item_name} x${formatQty(i.quantity)} @ ${Number(i.unit_price).toFixed(2)}`)
        .join('; '),
      Number(b.subtotal).toFixed(2),
      Number(b.discount).toFixed(2),
      Number(b.total).toFixed(2),
      b.note ?? '',
    ]),
  );

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(csv, `billbook-bills-${stamp}.csv`);
}
