import { ImageResponse } from 'next/og';
import { loadLogoDataUrl, loadPublicBill } from '@/lib/public-bill';
import { PreviewCard } from '@/lib/receipt-image';

export const runtime = 'edge';

// The picture WhatsApp (and other apps) show above the bill link.
export const alt = 'Bill preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { token: string } }) {
  const bill = await loadPublicBill(params.token);

  if (!bill) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', background: '#0b0d12', color: '#f1f3f6', fontSize: 56, fontWeight: 700 }}>
          BillBook
        </div>
      ),
      size,
    );
  }

  const logo = await loadLogoDataUrl(bill.business.logo_url);
  return new ImageResponse(<PreviewCard bill={bill} logo={logo} />, size);
}
