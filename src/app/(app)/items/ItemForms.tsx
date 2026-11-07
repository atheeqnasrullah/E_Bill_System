'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { addItem, deleteItem, updateItem, type FormState } from './actions';
import { formatRs } from '@/lib/format';
import type { Item } from '@/lib/types';

function SubmitButton({ label, pendingLabel, className }: { label: string; pendingLabel: string; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  );
}

/** "Add item" form at the top of My items. */
export function AddItemForm() {
  const [state, action] = useFormState<FormState, FormData>(addItem, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="card space-y-3">
      <h2 className="font-semibold">Add an item</h2>
      <div className="grid grid-cols-[1fr_8rem] gap-2">
        <input name="name" required maxLength={200} placeholder="Item name, e.g. Rice 5kg" className="input" />
        <input name="price" inputMode="decimal" placeholder="Price" className="input" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-brand-700">✓ {state.ok}</p>}
      <SubmitButton label="+ Add item" pendingLabel="Adding…" className="btn-primary w-full" />
    </form>
  );
}

/** One row in the item list, with inline edit + delete. */
export function ItemRow({ item }: { item: Item }) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useFormState<FormState, FormData>(updateItem.bind(null, item.id), undefined);

  useEffect(() => {
    if (state?.ok) setEditing(false);
  }, [state]);

  if (!editing) {
    return (
      <li className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{item.name}</p>
          <p className="text-sm tabular-nums text-slate-500">{formatRs(item.price)}</p>
        </div>
        <button type="button" onClick={() => setEditing(true)} className="rounded-lg px-3 py-2 text-sm font-medium text-brand-700 hover:bg-slate-100">
          Edit
        </button>
      </li>
    );
  }

  return (
    <li className="space-y-2 px-4 py-3">
      <form action={action} className="space-y-2">
        <div className="grid grid-cols-[1fr_8rem] gap-2">
          <input name="name" defaultValue={item.name} required maxLength={200} className="input" aria-label="Item name" />
          <input name="price" defaultValue={String(Number(item.price))} inputMode="decimal" className="input" aria-label="Price" />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <div className="flex gap-2">
          <SubmitButton label="Save" pendingLabel="Saving…" className="btn-primary flex-1" />
          <button type="button" onClick={() => setEditing(false)} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
      <form
        action={deleteItem.bind(null, item.id)}
        onSubmit={(e) => {
          if (!confirm(`Delete "${item.name}" from My items?`)) e.preventDefault();
        }}
      >
        <button type="submit" className="w-full py-2 text-sm font-medium text-red-600">
          Delete item
        </button>
      </form>
    </li>
  );
}
