'use client';

import { useEffect, useState } from 'react';
import type { PublicBill } from '@/lib/types';

/**
 * Builds the PDF in the browser. The PDF library (~500 KB) is loaded only
 * when the button is tapped, so pages stay fast.
 * If the logo cannot be loaded (e.g. network/CORS), we retry without it.
 */
async function makePdfBlob(bill: PublicBill): Promise<Blob> {
  const [{ pdf }, { default: BillPdf }] = await Promise.all([import('@react-pdf/renderer'), import('./BillPdf')]);
  try {
    return await pdf(<BillPdf bill={bill} />).toBlob();
  } catch {
    return await pdf(<BillPdf bill={bill} includeLogo={false} />).toBlob();
  }
}

/** "Download PDF" + (on phones that support it) "Share PDF" which can send the file to WhatsApp. */
export default function PdfButtons({ bill }: { bill: PublicBill }) {
  const [busy, setBusy] = useState<'download' | 'share' | null>(null);
  const [canShareFiles, setCanShareFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filename = `${bill.bill_number}.pdf`;

  useEffect(() => {
    try {
      const probe = new File([''], 'x.pdf', { type: 'application/pdf' });
      setCanShareFiles(typeof navigator.canShare === 'function' && navigator.canShare({ files: [probe] }));
    } catch {
      setCanShareFiles(false);
    }
  }, []);

  async function download() {
    setBusy('download');
    setError(null);
    try {
      const blob = await makePdfBlob(bill);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (e) {
      setError('Could not create the PDF. ' + (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function share() {
    setBusy('share');
    setError(null);
    try {
      const blob = await makePdfBlob(bill);
      const file = new File([blob], filename, { type: 'application/pdf' });
      await navigator.share({ files: [file], title: filename });
    } catch (e) {
      // AbortError = user closed the share sheet; not an error.
      if ((e as Error).name !== 'AbortError') setError('Could not share the PDF.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <button type="button" onClick={download} disabled={!!busy} className="btn-secondary w-full">
        {busy === 'download' ? 'Preparing…' : '⬇ Download PDF'}
      </button>
      {canShareFiles && (
        <button type="button" onClick={share} disabled={!!busy} className="btn-secondary w-full">
          {busy === 'share' ? 'Preparing…' : '📎 Share PDF'}
        </button>
      )}
      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
    </>
  );
}
