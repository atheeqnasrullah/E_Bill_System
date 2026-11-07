'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { normalizeLkPhone } from '@/lib/phone';

const itemSchema = z.object({
  item_name: z.string().trim().min(1, 'Every item needs a name.').max(200),
  quantity: z.number().positive('Quantity must be more than 0.').max(1_000_000),
  unit_price: z.number().min(0, 'Price cannot be negative.').max(1_000_000_000),
});

const billSchema = z.object({
  phone: z.string(),
  customer_name: z.string().trim().max(120).optional(),
  items: z.array(itemSchema).min(1, 'Add at least one item.').max(200),
  discount_type: z.enum(['amount', 'percent']),
  discount_value: z.number().min(0).max(1_000_000_000),
  note: z.string().trim().max(500).optional(),
});

export type CreateBillInput = z.input<typeof billSchema>;

/**
 * Save a new bill. All numbering and totals happen inside the database
 * function create_bill() in a single transaction (see the SQL migration).
 */
export async function createBill(input: CreateBillInput): Promise<{ error: string }> {
  const parsed = billSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const phone = normalizeLkPhone(parsed.data.phone);
  if (!phone) return { error: 'Enter a valid mobile number, e.g. 0771234567.' };

  const { discount_type, discount_value } = parsed.data;
  if (discount_type === 'percent' && discount_value > 100) return { error: 'Discount % cannot be more than 100.' };

  const supabase = createClient();
  const { data, error } = await supabase.rpc('create_bill', {
    p_phone: phone,
    p_customer_name: parsed.data.customer_name ?? null,
    p_items: parsed.data.items,
    p_discount_type: discount_value > 0 ? discount_type : null,
    p_discount_value: discount_value,
    p_note: parsed.data.note ?? null,
  });

  if (error || !data) return { error: error?.message ?? 'Could not save the bill. Please try again.' };

  revalidatePath('/', 'layout');
  // redirect() must be called outside try/catch; it throws on purpose.
  redirect(`/bills/${(data as { id: string }).id}?new=1`);
}

/** Delete a bill (its items are removed automatically by ON DELETE CASCADE). */
export async function deleteBill(billId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('bills').delete().eq('id', billId);
  if (error) throw new Error(error.message);
  revalidatePath('/', 'layout');
  redirect('/bills');
}
