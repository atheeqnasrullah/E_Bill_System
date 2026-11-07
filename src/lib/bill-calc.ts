// Bill math for the live preview in the form.
// We work in CENTS (integers) to avoid floating point errors like 0.1 + 0.2.
// The database recomputes everything in create_bill(), so this is display only.

export type DiscountType = 'amount' | 'percent';

export interface DraftItem {
  item_name: string;
  quantity: string; // raw text from the input
  unit_price: string; // raw text from the input
}

/** Parse "1,250.50" → 1250.5 ; invalid → NaN */
export function parseNumber(s: string): number {
  if (s.trim() === '') return NaN;
  return Number(s.replace(/,/g, ''));
}

export function toCents(rupees: number): number {
  return Math.round(rupees * 100);
}

export function lineTotalCents(item: DraftItem): number {
  const qty = parseNumber(item.quantity);
  const price = parseNumber(item.unit_price);
  if (!Number.isFinite(qty) || !Number.isFinite(price) || qty <= 0 || price < 0) return 0;
  return Math.round(qty * toCents(price));
}

export function calcTotals(items: DraftItem[], discountType: DiscountType, discountValue: string) {
  const subtotal = items.reduce((sum, it) => sum + lineTotalCents(it), 0);

  const dv = parseNumber(discountValue);
  let discount = 0;
  if (Number.isFinite(dv) && dv > 0) {
    discount =
      discountType === 'percent'
        ? Math.round((subtotal * Math.min(dv, 100)) / 100)
        : Math.min(toCents(dv), subtotal);
  }

  // Values returned in rupees for display.
  return {
    subtotal: subtotal / 100,
    discount: discount / 100,
    total: (subtotal - discount) / 100,
  };
}
