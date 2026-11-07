// Sri Lankan mobile numbers.
// Users type "0771234567", "077 123 4567", "771234567" or "+94771234567".
// We always store "+94771234567" (E.164).

/** Returns "+947XXXXXXXX", or null if the input is not a valid Sri Lankan mobile number. */
export function normalizeLkPhone(input: string | null | undefined): string | null {
  if (!input) return null;
  let digits = input.replace(/[^\d]/g, ''); // drop spaces, dashes, "+"

  if (digits.startsWith('0094')) digits = digits.slice(4);
  else if (digits.startsWith('94') && digits.length === 11) digits = digits.slice(2);
  else if (digits.startsWith('0') && digits.length === 10) digits = digits.slice(1);

  // Now we expect 9 digits starting with 7, e.g. 771234567
  if (!/^7\d{8}$/.test(digits)) return null;
  return '+94' + digits;
}

/** "+94771234567" → "077 123 4567" (how people in Sri Lanka write it). */
export function formatLkPhone(e164: string | null | undefined): string {
  if (!e164) return '';
  const m = /^\+94(7\d)(\d{3})(\d{4})$/.exec(e164);
  return m ? `0${m[1]} ${m[2]} ${m[3]}` : e164;
}

/** "+94771234567" → "94771234567" (the format wa.me wants). */
export function toWhatsAppNumber(e164: string): string {
  return e164.replace(/^\+/, '');
}

/**
 * For searching: turn what the user typed ("0771", "+9477", "771") into a
 * fragment that matches inside the stored "+947..." value.
 */
export function phoneSearchFragment(q: string): string | null {
  let digits = q.replace(/[^\d]/g, '');
  if (!digits) return null;
  if (digits.startsWith('94')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  return digits || null;
}
