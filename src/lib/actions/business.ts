'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { normalizeLkPhone } from '@/lib/phone';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

const schema = z.object({
  name: z.string().trim().min(1, 'Business name is required.').max(120),
  address: optionalText(300),
  phone: optionalText(20),
  footer_note: optionalText(300),
  logo_url: z.string().url().nullable().optional(),
});

export type BusinessInput = z.input<typeof schema>;

/**
 * Create (onboarding) or update (settings) the logged-in user's business.
 * The logo is uploaded from the browser first; we only receive its URL here.
 */
export async function saveBusiness(input: BusinessInput): Promise<{ error?: string; ok?: boolean }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'You are logged out. Please log in again.' };

  const values = { ...parsed.data };
  // Business phone: accept mobile numbers (normalised) or landlines as typed.
  if (values.phone) values.phone = normalizeLkPhone(values.phone) ?? values.phone;
  if (values.logo_url === undefined) delete values.logo_url;

  const { data: existing } = await supabase.from('businesses').select('id').eq('owner_id', user.id).maybeSingle();

  // Employees work in someone else's shop; they cannot create or edit a profile.
  if (!existing) {
    const { data: memberOf } = await supabase.rpc('my_business_id');
    if (memberOf) return { error: 'Only the shop owner can edit the business profile.' };
  }

  const { error } = existing
    ? await supabase.from('businesses').update(values).eq('id', existing.id)
    : await supabase.from('businesses').insert({ ...values, owner_id: user.id });

  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  return { ok: true };
}
