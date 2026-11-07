import BillForm from '@/components/bill/BillForm';

export const metadata = { title: 'New bill' };

// /bills/new?phone=0771234567 pre-fills the customer (used from a customer page).
export default function NewBillPage({ searchParams }: { searchParams: { phone?: string } }) {
  return (
    <div className="space-y-4">
      <h1 className="page-title">New bill</h1>
      <BillForm initialPhone={searchParams.phone ?? ''} />
    </div>
  );
}
