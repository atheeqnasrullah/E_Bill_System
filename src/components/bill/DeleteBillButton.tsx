'use client';

import { useFormStatus } from 'react-dom';

/** Delete button that asks for confirmation before submitting its form. */
export default function DeleteBillButton({ billNumber }: { billNumber: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-danger w-full"
      onClick={(e) => {
        if (!confirm(`Delete bill ${billNumber}? This cannot be undone.`)) e.preventDefault();
      }}
    >
      {pending ? 'Deleting…' : 'Delete bill'}
    </button>
  );
}
