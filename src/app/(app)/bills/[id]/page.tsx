import Link from 'next/link';
import { notFound } from 'next/navigation';
import BillView from '@/components/bill/BillView';
import ShareActions from '@/components/bill/ShareActions';
import DeleteBillButton from '@/components/bill/DeleteBillButton';
import { createClient } from '@/lib/supabase/server';
import { getAppUrl, requireBusiness } from '@/lib/business';
import { deleteBill } from '../actions';
import type { PublicBill } from '@/lib/types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata = { title: 'Bill' };

// Owner's view of one bill: share, PDF, delete.
export default async function BillPage({ params, searchParams }: { params: { id: string }; searchParams: { new?: string } }) {
  if (!UUID.test(params.id)) notFound();
  const { role } = await requireBusiness();
  const supabase = createClient();

  // RLS makes sure this only finds bills of the logged-in owner.
  const { data: row } = await supabase.from('bills').select('public_token, customer_id').eq('id', params.id).maybeSingle();
  if (!row) notFound();

  // Reuse the same data shape as the public page.
  const { data } = await supabase.rpc('get_public_bill', { p_token: row.public_token });
  if (!data) notFound();
  const bill = data as PublicBill;
  const link = `${getAppUrl()}/b/${bill.public_token}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/bills" className="text-sm font-medium text-slate-600">
          ← All bills
        </Link>
        <Link href={`/customers/${row.customer_id}`} className="text-sm font-medium text-brand-700">
          Customer →
        </Link>
      </div>

      {searchParams.new && (
        <div className="rounded-xl bg-brand-50 p-4 text-brand-900">
          <p className="font-semibold">✓ Bill {bill.bill_number} saved</p>
          <p className="text-sm">Now send it to the customer on WhatsApp.</p>
        </div>
      )}

      <ShareActions bill={bill} link={link} />
      <BillView bill={bill} />

      <div className={`grid gap-3 pt-2 ${role === 'owner' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <Link href="/bills/new" className="btn-primary w-full">
          + New bill
        </Link>
        {/* Only the owner can delete bills (also enforced in the database). */}
        {role === 'owner' && (
          <form action={deleteBill.bind(null, params.id)}>
            <DeleteBillButton billNumber={bill.bill_number} />
          </form>
        )}
      </div>
    </div>
  );
}
