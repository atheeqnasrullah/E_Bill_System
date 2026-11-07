import { ImageResponse } from 'next/og';
import { loadLogoDataUrl, loadPublicBill } from '@/lib/public-bill';
import { RECEIPT_WIDTH, ReceiptImage, receiptHeight } from '@/lib/receipt-image';

// Edge runtime: fast, and avoids a Windows-only font path bug in local dev.
export const runtime = 'edge';

// GET /b/<token>/image → PNG picture of the receipt (for "Send as image").
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const bill = await loadPublicBill(params.token);
  if (!bill) return new Response('Bill not found', { status: 404 });
  const logo = await loadLogoDataUrl(bill.business.logo_url);

  return new ImageResponse(<ReceiptImage bill={bill} logo={logo} />, {
    width: RECEIPT_WIDTH,
    height: receiptHeight(bill),
    headers: {
      // Bills never change after saving, so the picture can be cached.
      'Cache-Control': 'public, max-age=86400',
      'Content-Disposition': `inline; filename="${bill.bill_number}.png"`,
    },
  });
}
