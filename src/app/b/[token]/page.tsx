import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import BillView from '@/components/bill/BillView';
import PdfButtons from '@/components/bill/PdfButtons';
import { createClient } from '@/lib/supabase/server';
import type { PublicBill } from '@/lib/types';

// PUBLIC page: anyone with the link can see this ONE bill. No login.
// The data comes only from get_public_bill(token), never from the tables.

export const dynamic = 'force-dynamic';

const loadBill = cache(async (token: string): Promise<PublicBill | null> => {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const supabase = createClient();
  const { data } = await supabase.rpc('get_public_bill', { p_token: token });
  return (data as PublicBill | null) ?? null;
});

export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  const bill = await loadBill(params.token);
  return {
    title: bill ? `${bill.bill_number} · ${bill.business.name}` : 'Bill not found',
    robots: { index: false, follow: false },
  };
}

export default async function PublicBillPage({ params }: { params: { token: string } }) {
  const bill = await loadBill(params.token);
  if (!bill) notFound();

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <BillView bill={bill} />
      <div className="no-print grid grid-cols-2 gap-3">
        <PdfButtons bill={bill} />
      </div>
      <p className="no-print pt-4 text-center text-xs text-slate-400">Digital bill by BillBook</p>
    </main>
  );
}
