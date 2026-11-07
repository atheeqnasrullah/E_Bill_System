'use client';

import { useEffect, useState } from 'react';

/**
 * "Send as image": gets the PNG receipt from /b/<token>/image.
 *  - Phones: opens the share menu → pick WhatsApp → pick the customer.
 *  - Laptops (no file sharing): downloads the PNG instead.
 */
export default function ImageShareButton({
  token,
  billNumber,
  message,
  className = 'btn-secondary w-full',
}: {
  token: string;
  billNumber: string;
  message?: string;
  className?: string;
}) {
  const [canShare, setCanShare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const probe = new File([''], 'x.png', { type: 'image/png' });
      setCanShare(typeof navigator.canShare === 'function' && navigator.canShare({ files: [probe] }));
    } catch {
      setCanShare(false);
    }
  }, []);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/b/${token}/image`);
      if (!res.ok) throw new Error('Could not create the image.');
      const blob = await res.blob();
      const file = new File([blob], `${billNumber}.png`, { type: 'image/png' });

      if (canShare) {
        // Some apps ignore the text when a file is attached; that's fine.
        await navigator.share({ files: [file], text: message });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message || 'Could not share the image.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={run} disabled={busy} className={className}>
        {busy ? 'Preparing…' : canShare ? '🖼 Send as image' : '🖼 Download image'}
      </button>
      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
    </>
  );
}
