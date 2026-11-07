'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export type FormState = { error?: string; ok?: string } | undefined;

/** Owner invites an employee by email. They join when they sign up / log in with it. */
export async function addEmployee(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.string().trim().toLowerCase().email('Enter a valid email address.').safeParse(formData.get('email'));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const email = parsed.data;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Please log in again.' };
  if (user.email?.toLowerCase() === email) return { error: 'That is your own email.' };

  const { data: biz } = await supabase.from('businesses').select('id').eq('owner_id', user.id).maybeSingle();
  if (!biz) return { error: 'Only the shop owner can add employees.' };

  const { error } = await supabase.from('business_members').insert({ business_id: biz.id, email });
  if (error) return { error: error.code === '23505' ? 'This email is already on your team.' : error.message };

  revalidatePath('/employees');
  return { ok: `Invited ${email}` };
}

export async function removeEmployee(id: string) {
  const supabase = createClient();
  await supabase.from('business_members').delete().eq('id', id);
  revalidatePath('/employees');
}
