import { formatDateTime, formatQty, formatRs } from '@/lib/format';
import { formatLkPhone } from '@/lib/phone';
import type { PublicBill } from '@/lib/types';

/** The bill as it looks on screen. Shared by the owner's page and the public page. */
export default function BillView({ bill }: { bill: PublicBill }) {
  const { business, customer } = bill;

  return (
    // "paper" switches this card to the light palette so it looks like a real bill.
    <article className="paper card overflow-hidden border-slate-200 p-0 shadow-xl shadow-black/30">
      {/* Header: business */}
      <header className="flex items-start gap-4 border-b border-slate-100 p-5">
        {business.logo_url && (
          <img src={business.logo_url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-contain" />
        )}
        <div className="min-w-0">
          <h2 className="text-xl font-bold">{business.name}</h2>
          {business.address && <p className="whitespace-pre-line text-sm text-slate-600">{business.address}</p>}
          {business.phone && <p className="text-sm text-slate-600">{formatLkPhone(business.phone)}</p>}
        </div>
      </header>

      {/* Bill meta */}
      <div className="grid grid-cols-2 gap-3 bg-slate-50 px-5 py-3 text-sm">
        <div>
          <p className="text-slate-500">Bill no</p>
          <p className="font-semibold">{bill.bill_number}</p>
        </div>
        <div className="text-right">
          <p className="text-slate-500">Date</p>
          <p className="font-semibold">{formatDateTime(bill.created_at)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-slate-500">Billed to</p>
          <p className="font-semibold">
            {customer.name ? `${customer.name} · ` : ''}
            {formatLkPhone(customer.phone)}
          </p>
        </div>
      </div>

      {/* Items */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-slate-500">
            <th className="px-5 py-2 font-medium">Item</th>
            <th className="px-2 py-2 text-right font-medium">Qty</th>
            <th className="px-2 py-2 text-right font-medium">Price</th>
            <th className="px-5 py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bill.items.map((it, i) => (
            <tr key={i}>
              <td className="px-5 py-2">{it.item_name}</td>
              <td className="px-2 py-2 text-right tabular-nums">{formatQty(it.quantity)}</td>
              <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums">{formatRs(it.unit_price).replace('Rs. ', '')}</td>
              <td className="whitespace-nowrap px-5 py-2 text-right tabular-nums">{formatRs(it.line_total).replace('Rs. ', '')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="space-y-1 border-t border-slate-200 px-5 py-4">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatRs(bill.subtotal)}</span>
        </div>
        {Number(bill.discount) > 0 && (
          <div className="flex justify-between text-slate-600">
            <span>Discount{bill.discount_type === 'percent' ? ` (${Number(bill.discount_value)}%)` : ''}</span>
            <span className="tabular-nums">− {formatRs(bill.discount)}</span>
          </div>
        )}
        <div className="flex justify-between pt-1 text-xl font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatRs(bill.total)}</span>
        </div>
      </div>

      {bill.note && (
        <div className="border-t border-slate-100 px-5 py-3 text-sm">
          <span className="text-slate-500">Note: </span>
          <span className="whitespace-pre-wrap">{bill.note}</span>
        </div>
      )}
      {business.footer_note && (
        <footer className="border-t border-slate-100 px-5 py-4 text-center text-sm text-slate-600">{business.footer_note}</footer>
      )}
    </article>
  );
}
