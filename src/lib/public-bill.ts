// Load a public bill by token WITHOUT cookies (used by image routes,
// which are fetched by WhatsApp's link-preview bot, not by a logged-in user).
import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { PublicBill } from './types';

export async function loadPublicBill(token: string): Promise<PublicBill | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { data } = await supabase.rpc('get_public_bill', { p_token: token });
  return (data as PublicBill | null) ?? null;
}

/**
 * Download the shop logo and turn it into a data URL for the image renderer.
 * Returns null if it is missing, too big, or a format the renderer can't draw (webp).
 */
export async function loadLogoDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: 'force-cache' });
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || !/image\/(png|jpe?g)/.test(type)) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length > 1_500_000) return null;
    // Base64 without Node's Buffer (works in the edge runtime too).
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return `data:${type};base64,${btoa(binary)}`;
  } catch {
    return null;
  }
}
