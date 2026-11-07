import { formatRs } from './format';
import { toWhatsAppNumber } from './phone';

/** The message the customer receives on WhatsApp. */
export function buildBillMessage(opts: {
  customerName: string | null;
  billNumber: string;
  businessName: string;
  total: number | string;
  link: string;
}): string {
  const greeting = opts.customerName ? `Hi ${opts.customerName},` : 'Hi,';
  // The link sits on its own line so WhatsApp shows it as a tappable link.
  return [
    greeting,
    `Here is your bill *${opts.billNumber}* from *${opts.businessName}*.`,
    `Total: *${formatRs(opts.total)}*`,
    '',
    'View / download your bill:',
    opts.link,
    '',
    'Thank you!',
  ].join('\n');
}

/** https://wa.me/94771234567?text=... opens WhatsApp with the message typed in. */
export function buildWhatsAppUrl(phoneE164: string, message: string): string {
  return `https://wa.me/${toWhatsAppNumber(phoneE164)}?text=${encodeURIComponent(message)}`;
}
