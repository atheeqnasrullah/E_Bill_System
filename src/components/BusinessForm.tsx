'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { saveBusiness } from '@/lib/actions/business';
import type { Business } from '@/lib/types';

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB (matches the storage bucket limit)

/**
 * Business profile form, used on /onboarding (create) and /settings (edit).
 * Uploads the logo straight to Supabase Storage at logos/<user id>/...
 */
export default function BusinessForm({
  userId,
  initial,
  mode,
}: {
  userId: string;
  initial?: Business | null;
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initial?.logo_url ?? null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  function onPickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Logo must be a PNG, JPG or WEBP image.');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError('Logo must be smaller than 2 MB.');
      return;
    }
    setError(null);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function removeLogo() {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const form = new FormData(e.currentTarget);
    setPending(true);

    try {
      // 1. Upload a new logo if one was picked.
      let logo_url: string | null | undefined = logoPreview ? undefined : null; // null = removed
      if (logoFile) {
        const supabase = createClient();
        const ext = logoFile.name.split('.').pop()?.toLowerCase() || 'png';
        const path = `${userId}/logo-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('logos')
          .upload(path, logoFile, { upsert: true, contentType: logoFile.type });
        if (upErr) {
          setError('Logo upload failed: ' + upErr.message);
          return;
        }
        logo_url = supabase.storage.from('logos').getPublicUrl(path).data.publicUrl;
      }

      // 2. Save the profile.
      const res = await saveBusiness({
        name: String(form.get('name') ?? ''),
        address: String(form.get('address') ?? ''),
        phone: String(form.get('phone') ?? ''),
        footer_note: String(form.get('footer_note') ?? ''),
        logo_url,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      if (mode === 'create') {
        router.replace('/dashboard');
      } else {
        setSaved(true);
        setLogoFile(null);
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Logo */}
      <div className="card flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
          {logoPreview ? (
            <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-slate-400">No logo</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="btn-secondary cursor-pointer">
            {logoPreview ? 'Change logo' : 'Upload logo'}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={onPickLogo}
            />
          </label>
          {logoPreview && (
            <button type="button" onClick={removeLogo} className="text-left text-sm text-red-600">
              Remove logo
            </button>
          )}
        </div>
      </div>

      <div className="card space-y-4">
        <div>
          <label htmlFor="name" className="label">
            Business name *
          </label>
          <input id="name" name="name" required maxLength={120} defaultValue={initial?.name ?? ''} className="input" />
        </div>
        <div>
          <label htmlFor="address" className="label">
            Address
          </label>
          <textarea
            id="address"
            name="address"
            rows={2}
            maxLength={300}
            defaultValue={initial?.address ?? ''}
            className="input py-3"
          />
        </div>
        <div>
          <label htmlFor="phone" className="label">
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="07XXXXXXXX"
            maxLength={20}
            defaultValue={initial?.phone ?? ''}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="footer_note" className="label">
            Bill footer note
          </label>
          <textarea
            id="footer_note"
            name="footer_note"
            rows={2}
            maxLength={300}
            placeholder="Thank you! Come again."
            defaultValue={initial?.footer_note ?? ''}
            className="input py-3"
          />
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {saved && <p className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">Saved ✓</p>}

      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? 'Saving…' : mode === 'create' ? 'Save & continue' : 'Save changes'}
      </button>
    </form>
  );
}
