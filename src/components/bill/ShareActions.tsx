'use client';

import { useState } from 'react';
import PdfButtons from './PdfButtons';
import { buildBillMessage, buildWhatsAppUrl } from '@/lib/whatsapp';
import type { PublicBill } from '@/lib/types';

/** Owner's share panel: WhatsApp, copy link, PDF. */
export default function ShareActions({ bill, link }: { bill: PublicBill; link: string }) {
  const [copied, setCopied] = useState(false);

  const message = buildBillMessage({
    customerName: bill.customer.name,
    billNumber: bill.bill_number,
    businessName: bill.business.name,
    total: bill.total,
    link,
  });

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', link);
    }
  }

  return (
    <div className="no-print space-y-3">
      <a href={buildWhatsAppUrl(bill.customer.phone, message)} target="_blank" rel="noopener noreferrer" className="btn-whatsapp w-full text-lg">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
          <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3ZM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8ZM12 0a12 12 0 0 0-10.3 18L0 24l6.2-1.6A12 12 0 1 0 12 0Z" />
        </svg>
        Share on WhatsApp
      </a>
      <div className="grid grid-cols-2 gap-3">
        <PdfButtons bill={bill} />
        <button type="button" onClick={copyLink} className="btn-secondary w-full">
          {copied ? '✓ Copied' : '🔗 Copy link'}
        </button>
        <a href={link} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full">
          👁 Customer view
        </a>
      </div>
    </div>
  );
}
