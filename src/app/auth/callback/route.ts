import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// The link in the confirmation email lands here with ?code=...
// We swap the code for a session cookie, then continue to onboarding.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/onboarding`);
  }
  return NextResponse.redirect(`${origin}/login`);
}
