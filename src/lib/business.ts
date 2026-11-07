// Server-only helpers to get the logged-in user and their business.
import 'server-only';
import { cache } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';
import type { Business } from './types';

export type Role = 'owner' | 'staff';

/** Logged-in user, or null. Cached for the duration of one request. */
export const getUser = cache(async () => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * The shop this user works in: the one they own, or the one they were
 * invited to as an employee. Also links any pending employee invite.
 * Returns null if they have not set up a shop yet.
 */
export const getBusiness = cache(async (): Promise<Business | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = createClient();

  // claim_invites() comes from migration 0002. If that migration has not been
  // run yet, fall back to "the business I own".
  const { data: bizId, error } = await supabase.rpc('claim_invites');
  const query = supabase.from('businesses').select('*');
  const { data } = error
    ? await query.eq('owner_id', user.id).maybeSingle()
    : bizId
      ? await query.eq('id', bizId as string).maybeSingle()
      : { data: null };

  return (data as Business | null) ?? null;
});

/** Use in pages that need a business: redirects to /login or /onboarding. */
export async function requireBusiness(): Promise<{ business: Business; role: Role; email: string }> {
  const user = await getUser();
  if (!user) redirect('/login');
  const business = await getBusiness();
  if (!business) redirect('/onboarding');
  return { business, role: business.owner_id === user.id ? 'owner' : 'staff', email: user.email ?? '' };
}

/** Public base URL for bill links, e.g. https://billbook.vercel.app */
export function getAppUrl(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, '');
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
