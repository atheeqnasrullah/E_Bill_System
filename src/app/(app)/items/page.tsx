import { createClient } from '@/lib/supabase/server';
import type { Item } from '@/lib/types';
import { AddItemForm, ItemRow } from './ItemForms';

export const metadata = { title: 'My items' };

const clean = (s: string) => s.replace(/[,()%*\\":]/g, '').trim();

// Saved item list. Items are also added automatically when you save a bill,
// and they show up as suggestions in the New bill form.
export default async function ItemsPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = createClient();
  const q = clean(searchParams.q ?? '');

  let query = supabase.from('items').select('id, name, price, updated_at').order('name').limit(500);
  if (q) query = query.ilike('name', `%${q}%`);
  const { data, error } = await query;
  const items = (data ?? []) as Item[];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">My items</h1>
        <p className="text-sm text-slate-500">Your price list. Items you bill are saved here automatically.</p>
      </div>

      <AddItemForm />

      <form action="/items" className="flex gap-2">
        <input name="q" type="search" defaultValue={q} placeholder="Search items" className="input" />
        <button className="btn-secondary" type="submit">
          Search
        </button>
      </form>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error.message.includes('items') ? 'Run the second SQL file (0002) in Supabase to enable My items.' : error.message}
        </p>
      )}

      {items.length === 0 ? (
        <div className="card py-10 text-center text-slate-500">{q ? 'No items match your search.' : 'No items yet.'}</div>
      ) : (
        <ul className="card divide-y divide-slate-100 p-0">
          {items.map((it) => (
            <ItemRow key={it.id} item={it} />
          ))}
        </ul>
      )}
    </div>
  );
}
