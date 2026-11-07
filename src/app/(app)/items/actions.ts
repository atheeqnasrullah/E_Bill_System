'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export type FormState = { error?: string; ok?: string } | undefined;

const itemSchema = z.object({
  name: z.string().trim().min(1, 'Item name is required.').max(200),
  price: z.coerce.number({ invalid_type_error: 'Enter a valid price.' }).min(0, 'Price cannot be negative.').max(1_000_000_000),
});

/** Add a new item, or update the price if an item with the same name exists. */
export async function addItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = itemSchema.safeParse({
    name: formData.get('name'),
    price: String(formData.get('price') ?? '').replace(/,/g, '') || '0',
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { data: bizId } = await supabase.rpc('my_business_id');
  if (!bizId) return { error: 'No shop found.' };

  // Same name (any capitalisation) already saved? Update its price instead.
  const { data: existing } = await supabase.from('items').select('id').ilike('name', parsed.data.name.replace(/[%_]/g, '\\$&')).maybeSingle();

  const { error } = existing
    ? await supabase.from('items').update({ price: parsed.data.price, updated_at: new Date().toISOString() }).eq('id', existing.id)
    : await supabase.from('items').insert({ business_id: bizId, name: parsed.data.name, price: parsed.data.price });

  if (error) return { error: error.message };
  revalidatePath('/items');
  return { ok: existing ? `Updated price of "${parsed.data.name}".` : `Added "${parsed.data.name}".` };
}

/** Edit an item's name and price. */
export async function updateItem(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = itemSchema.safeParse({
    name: formData.get('name'),
    price: String(formData.get('price') ?? '').replace(/,/g, '') || '0',
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { error } = await supabase
    .from('items')
    .update({ name: parsed.data.name, price: parsed.data.price, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: error.code === '23505' ? 'Another item already has this name.' : error.message };
  revalidatePath('/items');
  return { ok: 'Saved' };
}

export async function deleteItem(id: string) {
  const supabase = createClient();
  await supabase.from('items').delete().eq('id', id);
  revalidatePath('/items');
}
