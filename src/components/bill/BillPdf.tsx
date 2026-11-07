// PDF version of a bill, built with @react-pdf/renderer.
// Only loaded in the browser, when the user taps "Download PDF".
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { formatDateTime, formatQty, formatRs } from '@/lib/format';
import { formatLkPhone } from '@/lib/phone';
import type { PublicBill } from '@/lib/types';

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', color: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  logo: { width: 64, height: 64, objectFit: 'contain', marginRight: 14 },
  bizName: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  muted: { color: '#64748b' },
  metaBox: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f1f5f9', padding: 10, borderRadius: 4, marginBottom: 14 },
  label: { color: '#64748b', fontSize: 8, marginBottom: 2, textTransform: 'uppercase' },
  bold: { fontFamily: 'Helvetica-Bold' },
  tableHead: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#cbd5e1', paddingBottom: 5, marginBottom: 3 },
  row: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 0.5, borderColor: '#e2e8f0' },
  cItem: { flex: 1, paddingRight: 6 },
  cQty: { width: 45, textAlign: 'right' },
  cPrice: { width: 80, textAlign: 'right' },
  cTotal: { width: 85, textAlign: 'right' },
  totals: { marginTop: 10, marginLeft: 'auto', width: 220 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  grand: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#0f172a', marginTop: 4, paddingTop: 5, fontSize: 13, fontFamily: 'Helvetica-Bold' },
  note: { marginTop: 18 },
  footer: { position: 'absolute', bottom: 30, left: 36, right: 36, textAlign: 'center', color: '#64748b', borderTopWidth: 0.5, borderColor: '#e2e8f0', paddingTop: 8 },
});

const num = (v: number | string) => formatRs(v).replace('Rs. ', '');

export default function BillPdf({ bill, includeLogo = true }: { bill: PublicBill; includeLogo?: boolean }) {
  const { business, customer } = bill;

  return (
    <Document title={`${bill.bill_number} - ${business.name}`} author={business.name}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          {/* react-pdf's <Image> has no alt prop (PDFs are not HTML). */}
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {includeLogo && business.logo_url ? <Image src={business.logo_url} style={s.logo} /> : null}
          <View style={{ flex: 1 }}>
            <Text style={s.bizName}>{business.name}</Text>
            {business.address ? <Text style={s.muted}>{business.address}</Text> : null}
            {business.phone ? <Text style={s.muted}>{formatLkPhone(business.phone)}</Text> : null}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#059669' }}>BILL</Text>
          </View>
        </View>

        <View style={s.metaBox}>
          <View>
            <Text style={s.label}>Bill no</Text>
            <Text style={s.bold}>{bill.bill_number}</Text>
          </View>
          <View>
            <Text style={s.label}>Billed to</Text>
            <Text style={s.bold}>{customer.name || '—'}</Text>
            <Text>{formatLkPhone(customer.phone)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.label}>Date</Text>
            <Text style={s.bold}>{formatDateTime(bill.created_at)}</Text>
          </View>
        </View>

        <View style={s.tableHead}>
          <Text style={[s.cItem, s.bold]}>Item</Text>
          <Text style={[s.cQty, s.bold]}>Qty</Text>
          <Text style={[s.cPrice, s.bold]}>Unit price</Text>
          <Text style={[s.cTotal, s.bold]}>Amount</Text>
        </View>
        {bill.items.map((it, i) => (
          <View key={i} style={s.row} wrap={false}>
            <Text style={s.cItem}>{it.item_name}</Text>
            <Text style={s.cQty}>{formatQty(it.quantity)}</Text>
            <Text style={s.cPrice}>{num(it.unit_price)}</Text>
            <Text style={s.cTotal}>{num(it.line_total)}</Text>
          </View>
        ))}

        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text>Subtotal</Text>
            <Text>{formatRs(bill.subtotal)}</Text>
          </View>
          {Number(bill.discount) > 0 ? (
            <View style={s.totalRow}>
              <Text>Discount{bill.discount_type === 'percent' ? ` (${Number(bill.discount_value)}%)` : ''}</Text>
              <Text>- {formatRs(bill.discount)}</Text>
            </View>
          ) : null}
          <View style={s.grand}>
            <Text>Total</Text>
            <Text>{formatRs(bill.total)}</Text>
          </View>
        </View>

        {bill.note ? (
          <View style={s.note}>
            <Text style={s.label}>Note</Text>
            <Text>{bill.note}</Text>
          </View>
        ) : null}

        <Text style={s.footer} fixed>
          {business.footer_note || 'Thank you!'}
        </Text>
      </Page>
    </Document>
  );
}
