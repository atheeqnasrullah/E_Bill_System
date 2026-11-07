import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import BillView from '@/components/bill/BillView';
import PdfButtons from '@/components/bill/PdfButtons';
import { createClient } from '@/lib/supabase/server';
import type { PublicBill } from '@/lib/types';
import { formatDate, formatRs } from '@/lib/format';
import ImageShareButton from '@/components/bill/ImageShareButton';

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
  if (!bill) return { title: 'Bill not found', robots: { index: false, follow: false } };

  const title = `${bill.bill_number} · ${bill.business.name}`;
  const description = `Total ${formatRs(bill.total)} · ${formatDate(bill.created_at)} · Tap to view or download your bill`;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    // The preview picture comes from opengraph-image.tsx next to this page.
    openGraph: { title, description, type: 'website', siteName: 'BillBook' },
    twitter: { card: 'summary_large_image', title, description },
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
        <div className="col-span-2">
          <ImageShareButton token={bill.public_token} billNumber={bill.bill_number} />
        </div>
      </div>
      <p className="no-print pt-4 text-center text-xs text-slate-400">Digital bill by BillBook</p>
    </main>
  );
}
