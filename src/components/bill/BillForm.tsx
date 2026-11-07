'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { normalizeLkPhone, formatLkPhone } from '@/lib/phone';
import { calcTotals, lineTotalCents, parseNumber, type DiscountType, type DraftItem } from '@/lib/bill-calc';
import { formatRs } from '@/lib/format';
import { createBill } from '@/app/(app)/bills/actions';

type Row = DraftItem & { key: number };
type SavedItem = { name: string; price: number };

let nextKey = 1;
const emptyRow = (): Row => ({ key: nextKey++, item_name: '', quantity: '1', unit_price: '' });

/**
 * The "New bill" form.
 *  - phone number: looks up an existing customer and auto-fills the name
 *  - line items with live totals; item names are suggested from "My items"
 *    and picking one fills in its saved price
 *  - optional discount (Rs or %) and note
 *  - Review step, then Save
 */
export default function BillForm({ initialPhone = '' }: { initialPhone?: string }) {
  const [phone, setPhone] = useState(initialPhone);
  const [name, setName] = useState('');
  const [knownCustomer, setKnownCustomer] = useState(false);
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [discountType, setDiscountType] = useState<DiscountType>('amount');
  const [discountValue, setDiscountValue] = useState('');
  const [note, setNote] = useState('');
  const [showExtras, setShowExtras] = useState(false);
  const [step, setStep] = useState<'edit' | 'review'>('edit');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const autoFilledName = useRef<string | null>(null);

  const totals = useMemo(() => calcTotals(rows, discountType, discountValue), [rows, discountType, discountValue]);
  const normalizedPhone = normalizeLkPhone(phone);
  const filledRows = rows.filter((r) => r.item_name.trim() || r.unit_price.trim());

  // Load "My items" once for suggestions. (Silently ignored if the table doesn't exist yet.)
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('items')
      .select('name, price')
      .order('name')
      .limit(1000)
      .then(({ data }) => setSavedItems((data as SavedItem[] | null) ?? []));
  }, []);

  // If a phone number was passed in (from a customer page), look it up.
  useEffect(() => {
    if (initialPhone) lookupCustomer(initialPhone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Look up the customer when the phone number is complete.
  async function lookupCustomer(value: string) {
    const e164 = normalizeLkPhone(value);
    if (!e164) {
      setKnownCustomer(false);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase.from('customers').select('name').eq('phone', e164).maybeSingle();
    setKnownCustomer(!!data);
    // Fill the name only if the user hasn't typed their own.
    if (data?.name) {
      setName((current) => {
        if (current === '' || current === autoFilledName.current) {
          autoFilledName.current = data.name;
          return data.name;
        }
        return current;
      });
    }
  }

  function updateRow(key: number, patch: Partial<DraftItem>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  // When an item name matches a saved item, fill its price (if price is empty).
  function onItemNameChange(row: Row, value: string) {
    const match = savedItems.find((s) => s.name.toLowerCase() === value.trim().toLowerCase());
    updateRow(row.key, {
      item_name: value,
      ...(match && row.unit_price.trim() === '' ? { unit_price: String(Number(match.price)) } : {}),
    });
  }

  function removeRow(key: number) {
    setRows((rs) => (rs.length === 1 ? [emptyRow()] : rs.filter((r) => r.key !== key)));
  }

  /** Check the form before showing the review step. Returns an error or null. */
  function validate(): string | null {
    if (!normalizedPhone) return 'Enter a valid mobile number, e.g. 0771234567.';
    if (filledRows.length === 0) return 'Add at least one item.';
    for (const r of filledRows) {
      if (!r.item_name.trim()) return 'Every item needs a name.';
      const q = parseNumber(r.quantity);
      const p = parseNumber(r.unit_price);
      if (!Number.isFinite(q) || q <= 0) return `Check the quantity for "${r.item_name}".`;
      if (!Number.isFinite(p) || p < 0) return `Check the price for "${r.item_name}".`;
    }
    const dv = discountValue.trim() ? parseNumber(discountValue) : 0;
    if (!Number.isFinite(dv) || dv < 0) return 'Check the discount.';
    if (discountType === 'percent' && dv > 100) return 'Discount % cannot be more than 100.';
    return null;
  }

  function goToReview() {
    const err = validate();
    setError(err);
    if (!err) {
      setStep('review');
      window.scrollTo({ top: 0 });
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await createBill({
        phone,
        customer_name: name,
        items: filledRows.map((r) => ({
          item_name: r.item_name.trim(),
          quantity: parseNumber(r.quantity),
          unit_price: parseNumber(r.unit_price),
        })),
        discount_type: discountType,
        discount_value: discountValue.trim() ? parseNumber(discountValue) : 0,
        note,
      });
      // On success the server redirects, so we only get here on error.
      if (res?.error) {
        setError(res.error);
        setStep('edit');
      }
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------- Review
  if (step === 'review') {
    return (
      <div className="space-y-4">
        <div className="card">
          <p className="text-sm text-slate-500">Customer</p>
          <p className="text-lg font-semibold">{name || 'No name'}</p>
          <p className="text-slate-600">{formatLkPhone(normalizedPhone)}</p>
        </div>

        <div className="card divide-y divide-slate-100 p-0">
          {filledRows.map((r) => (
            <div key={r.key} className="flex items-start justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-medium">{r.item_name}</p>
                <p className="text-sm text-slate-500">
                  {parseNumber(r.quantity)} × {formatRs(parseNumber(r.unit_price))}
                </p>
              </div>
              <p className="font-semibold tabular-nums">{formatRs(lineTotalCents(r) / 100)}</p>
            </div>
          ))}
          <Totals totals={totals} discountType={discountType} discountValue={discountValue} />
        </div>

        {note.trim() && (
          <div className="card">
            <p className="text-sm text-slate-500">Note</p>
            <p className="whitespace-pre-wrap">{note}</p>
          </div>
        )}

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="btn-secondary" onClick={() => setStep('edit')} disabled={saving}>
            ← Edit
          </button>
          <button type="button" className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save bill'}
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------ Edit
  return (
    <div className="space-y-4">
      {/* Suggestions list for item names, from "My items". */}
      <datalist id="saved-items">
        {savedItems.map((s) => (
          <option key={s.name} value={s.name}>
            {formatRs(s.price)}
          </option>
        ))}
      </datalist>

      {/* Customer */}
      <div className="card space-y-4">
        <div>
          <label htmlFor="phone" className="label">
            Customer mobile *
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="07XXXXXXXX"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (normalizeLkPhone(e.target.value)) lookupCustomer(e.target.value);
              else setKnownCustomer(false);
            }}
            onBlur={(e) => lookupCustomer(e.target.value)}
            className="input text-lg tracking-wide"
          />
          {phone && !normalizedPhone && <p className="mt-1 text-xs text-slate-500">Format: 07XXXXXXXX</p>}
          {knownCustomer && <p className="mt-1 text-xs font-medium text-brand-700">✓ Existing customer</p>}
        </div>
        <div>
          <label htmlFor="cname" className="label">
            Customer name (optional)
          </label>
          <input id="cname" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className="input" />
        </div>
      </div>

      {/* Items */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Items</h2>
          {savedItems.length > 0 && <span className="text-xs text-slate-500">Start typing to pick from My items</span>}
        </div>
        {rows.map((r, i) => (
          <div key={r.key} className="rounded-xl border border-slate-200 p-3">
            <div className="flex gap-2">
              <input
                aria-label={`Item ${i + 1} name`}
                placeholder={`Item ${i + 1}`}
                list="saved-items"
                value={r.item_name}
                onChange={(e) => onItemNameChange(r, e.target.value)}
                maxLength={200}
                className="input"
              />
              <button
                type="button"
                onClick={() => removeRow(r.key)}
                className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl text-xl text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Remove item"
              >
                ×
              </button>
            </div>
            <div className="mt-2 grid grid-cols-[1fr_1.4fr] gap-2">
              <div>
                <label className="text-xs text-slate-500">Qty</label>
                <input
                  inputMode="decimal"
                  value={r.quantity}
                  onChange={(e) => updateRow(r.key, { quantity: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Unit price (Rs.)</label>
                <input
                  inputMode="decimal"
                  placeholder="0.00"
                  value={r.unit_price}
                  onChange={(e) => updateRow(r.key, { unit_price: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            <p className="mt-2 text-right text-sm text-slate-600">
              Line total: <span className="font-semibold tabular-nums text-slate-900">{formatRs(lineTotalCents(r) / 100)}</span>
            </p>
          </div>
        ))}
        <button type="button" onClick={() => setRows((rs) => [...rs, emptyRow()])} className="btn-secondary w-full">
          + Add item
        </button>
      </div>

      {/* Discount & note */}
      {!showExtras ? (
        <button type="button" onClick={() => setShowExtras(true)} className="w-full text-center text-sm font-medium text-brand-700">
          + Add discount or note
        </button>
      ) : (
        <div className="card space-y-4">
          <div>
            <span className="label">Discount</span>
            <div className="flex gap-2">
              <div className="flex overflow-hidden rounded-xl border border-slate-300">
                {(['amount', 'percent'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDiscountType(t)}
                    className={`min-h-[48px] px-4 font-semibold ${discountType === t ? 'bg-brand-600 text-white' : 'bg-card text-slate-600'}`}
                  >
                    {t === 'amount' ? 'Rs.' : '%'}
                  </button>
                ))}
              </div>
              <input
                inputMode="decimal"
                placeholder="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="input"
                aria-label="Discount value"
              />
            </div>
          </div>
          <div>
            <label htmlFor="note" className="label">
              Note
            </label>
            <textarea id="note" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className="input py-3" />
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="card p-0">
        <Totals totals={totals} discountType={discountType} discountValue={discountValue} />
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button type="button" onClick={goToReview} className="btn-primary w-full text-lg">
        Review bill · {formatRs(totals.total)}
      </button>
    </div>
  );
}

function Totals({
  totals,
  discountType,
  discountValue,
}: {
  totals: { subtotal: number; discount: number; total: number };
  discountType: DiscountType;
  discountValue: string;
}) {
  return (
    <div className="space-y-1 px-4 py-3">
      <div className="flex justify-between text-slate-600">
        <span>Subtotal</span>
        <span className="tabular-nums">{formatRs(totals.subtotal)}</span>
      </div>
      {totals.discount > 0 && (
        <div className="flex justify-between text-slate-600">
          <span>Discount{discountType === 'percent' ? ` (${parseNumber(discountValue)}%)` : ''}</span>
          <span className="tabular-nums">− {formatRs(totals.discount)}</span>
        </div>
      )}
      <div className="flex justify-between pt-1 text-xl font-bold">
        <span>Total</span>
        <span className="tabular-nums">{formatRs(totals.total)}</span>
      </div>
    </div>
  );
}
