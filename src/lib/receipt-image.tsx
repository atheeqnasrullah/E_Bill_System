// Receipt pictures rendered with next/og (ImageResponse).
// Note: next/og layouts need `display: flex` on every element with children.
import { formatDateTime, formatQty, formatRs } from './format';
import { formatLkPhone } from './phone';
import type { PublicBill } from './types';

const INK = '#0f172a';
const MUTED = '#64748b';
const PAPER = '#fdfcf8';
const LINE = '#e5e1d8';
const MAX_ROWS = 14;

const num = (v: number | string) => formatRs(v).replace('Rs. ', '');

// ---------------------------------------------------------------------------
// Portrait receipt (for "Send as image")
// ---------------------------------------------------------------------------
export const RECEIPT_WIDTH = 720;

export function receiptHeight(bill: PublicBill): number {
  const rows = Math.min(bill.items.length, MAX_ROWS) + (bill.items.length > MAX_ROWS ? 1 : 0);
  return (
    600 +
    rows * 52 +
    (Number(bill.discount) > 0 ? 44 : 0) +
    (bill.note ? 70 : 0) +
    (bill.business.footer_note ? 70 : 0) +
    (bill.business.address ? 30 : 0)
  );
}

export function ReceiptImage({ bill, logo }: { bill: PublicBill; logo: string | null }) {
  const { business, customer } = bill;
  const items = bill.items.slice(0, MAX_ROWS);
  const more = bill.items.length - items.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#0b0d12', padding: 32 }}>
      <div style={{ display: 'flex', flexDirection: 'column', background: PAPER, borderRadius: 24, color: INK, fontSize: 22 }}>
        {/* Business */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '36px 40px 28px' }}>
          {logo && <img alt="" src={logo} width={84} height={84} style={{ objectFit: 'contain', marginRight: 24, borderRadius: 12 }} />}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 36, fontWeight: 700 }}>{business.name}</div>
            {business.address && <div style={{ color: MUTED, marginTop: 4 }}>{business.address}</div>}
            {business.phone && <div style={{ color: MUTED, marginTop: 2 }}>{formatLkPhone(business.phone)}</div>}
          </div>
        </div>

        {/* Bill no / date / customer */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#f4f2ec', padding: '20px 40px', borderTop: `1px solid ${LINE}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ color: MUTED, fontSize: 18 }}>Bill no</div>
              <div style={{ fontWeight: 700 }}>{bill.bill_number}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ color: MUTED, fontSize: 18 }}>Date</div>
              <div style={{ fontWeight: 700 }}>{formatDateTime(bill.created_at)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 14 }}>
            <div style={{ color: MUTED, fontSize: 18 }}>Billed to</div>
            <div style={{ display: 'flex', fontWeight: 700 }}>
              {`${customer.name ? `${customer.name} · ` : ''}${formatLkPhone(customer.phone)}`}
            </div>
          </div>
        </div>

        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 40px 0' }}>
          <div style={{ display: 'flex', color: MUTED, fontSize: 18, padding: '12px 0', borderBottom: `1px solid ${LINE}` }}>
            <div style={{ display: 'flex', flex: 1 }}>Item</div>
            <div style={{ display: 'flex', width: 80, justifyContent: 'flex-end' }}>Qty</div>
            <div style={{ display: 'flex', width: 140, justifyContent: 'flex-end' }}>Price</div>
            <div style={{ display: 'flex', width: 160, justifyContent: 'flex-end' }}>Total</div>
          </div>
          {items.map((it, i) => (
            <div key={i} style={{ display: 'flex', height: 52, alignItems: 'center', borderBottom: `1px solid ${LINE}` }}>
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>{it.item_name}</div>
              <div style={{ display: 'flex', width: 80, justifyContent: 'flex-end' }}>{formatQty(it.quantity)}</div>
              <div style={{ display: 'flex', width: 140, justifyContent: 'flex-end' }}>{num(it.unit_price)}</div>
              <div style={{ display: 'flex', width: 160, justifyContent: 'flex-end' }}>{num(it.line_total)}</div>
            </div>
          ))}
          {more > 0 && (
            <div style={{ display: 'flex', height: 52, alignItems: 'center', color: MUTED }}>+ {more} more item{more === 1 ? '' : 's'} (open the link to see all)</div>
          )}
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '20px 40px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: MUTED }}>
            <div>Subtotal</div>
            <div>{formatRs(bill.subtotal)}</div>
          </div>
          {Number(bill.discount) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: MUTED, marginTop: 10 }}>
              <div>{bill.discount_type === 'percent' ? `Discount (${Number(bill.discount_value)}%)` : 'Discount'}</div>
              <div>- {formatRs(bill.discount)}</div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 34, fontWeight: 700 }}>
            <div>Total</div>
            <div>{formatRs(bill.total)}</div>
          </div>
        </div>

        {bill.note && (
          <div style={{ display: 'flex', padding: '16px 40px', borderTop: `1px solid ${LINE}`, color: MUTED }}>Note: {bill.note}</div>
        )}
        {business.footer_note && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '18px 40px 24px', borderTop: `1px solid ${LINE}`, color: MUTED }}>
            {business.footer_note}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18, color: '#6b7280', fontSize: 18 }}>Digital bill by BillBook</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Landscape card (WhatsApp / social link preview, 1200 x 630)
// ---------------------------------------------------------------------------
export function PreviewCard({ bill, logo }: { bill: PublicBill; logo: string | null }) {
  const items = bill.items.slice(0, 5);
  const more = bill.items.length - items.length;

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: '#0b0d12', padding: 48, color: '#f1f3f6' }}>
      {/* Left: shop + total */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 520, paddingRight: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {logo ? (
            <img alt="" src={logo} width={88} height={88} style={{ objectFit: 'contain', borderRadius: 16, background: PAPER, marginRight: 22 }} />
          ) : (
            <div style={{ display: 'flex', width: 88, height: 88, borderRadius: 16, background: '#059669', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800, marginRight: 22 }}>
              Rs
            </div>
          )}
          <div style={{ display: 'flex', fontSize: 40, fontWeight: 700, lineHeight: 1.1 }}>{bill.business.name}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 30, color: '#8b93a1' }}>Bill {bill.bill_number}</div>
          <div style={{ display: 'flex', fontSize: 24, color: '#8b93a1', marginTop: 6 }}>{formatDateTime(bill.created_at)}</div>
          <div style={{ display: 'flex', fontSize: 24, color: '#8b93a1', marginTop: 36 }}>Total</div>
          <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, color: '#34d399' }}>{formatRs(bill.total)}</div>
        </div>
      </div>

      {/* Right: paper receipt */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: PAPER, borderRadius: 24, padding: '32px 36px', color: INK, fontSize: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: MUTED, fontSize: 20, paddingBottom: 12, borderBottom: `2px dashed ${LINE}` }}>
          <div>Item</div>
          <div>Amount</div>
        </div>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${LINE}` }}>
            <div style={{ display: 'flex', maxWidth: 360, overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {formatQty(it.quantity)} × {it.item_name}
            </div>
            <div style={{ display: 'flex' }}>{num(it.line_total)}</div>
          </div>
        ))}
        {more > 0 && <div style={{ display: 'flex', padding: '12px 0', color: MUTED }}>+ {more} more</div>}
        <div style={{ display: 'flex', flex: 1 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 32, fontWeight: 800, paddingTop: 14, borderTop: `2px dashed ${LINE}` }}>
          <div>TOTAL</div>
          <div>{formatRs(bill.total)}</div>
        </div>
      </div>
    </div>
  );
}
