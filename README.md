# BillBook

Digital bill book for small shops in Sri Lanka. Create a bill on your phone, send it to the customer on WhatsApp (link + PDF), and keep every bill organised by customer phone number.

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase, Recharts and @react-pdf/renderer. See [ARCHITECTURE.md](ARCHITECTURE.md) for the design.

---

## 1. Create the Supabase project

1. Go to <https://supabase.com>, create a free account and a **New project**. Pick the Singapore or Mumbai region (closest to Sri Lanka).
2. Open **SQL Editor → New query**, paste everything from [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) and click **Run**. You should see "Success. No rows returned".
   This creates all tables, security rules (RLS), the bill-numbering function, the dashboard function and the `logos` storage bucket.
   Then open another **New query**, paste [`supabase/migrations/0002_items_employees_insights.sql`](supabase/migrations/0002_items_employees_insights.sql) and click **Run**. This adds My items, Employees and the extra Insights numbers.
3. **Authentication → Providers → Email**: keep Email enabled.
   - For quick local testing you can turn **Confirm email** OFF, so sign-up logs you in immediately.
   - If you keep it ON, go to **Authentication → URL Configuration** and add `http://localhost:3000/auth/callback` (and later your Vercel URL + `/auth/callback`) to **Redirect URLs**.

## 2. Put your keys in `.env.local`

In Supabase: **Project Settings → API**. Copy the **Project URL** and the **anon public** key.

Create a file named `.env.local` in the project root (next to `package.json`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...your-anon-key...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Or copy the template with `copy .env.example .env.local` (Windows) or `cp .env.example .env.local` (Mac/Linux), then edit it.

> Use only the **anon** key. Never put the `service_role` key in this app. Security comes from the database RLS rules.

## 3. Run it

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. To test on your phone over the same Wi-Fi, run `npm run dev -- -H 0.0.0.0` and open `http://<your-PC-IP>:3000`.

Other commands:

```bash
npm run build      # production build
npm run start      # run the production build
npm run typecheck  # TypeScript check
npm run lint       # ESLint
```

## 4. Test checklist (phase by phase)

**Phase 1: auth + business profile**
- [ ] Sign up → you land on "Set up your shop".
- [ ] Save name, address, phone, footer note and a logo → you land on the dashboard.
- [ ] Settings shows your saved details and logo. Edit and save works.
- [ ] Log out → visiting `/dashboard` sends you to `/login`.

**Phase 2: bills + numbering**
- [ ] New bill: type `0771234567`, add 2 items, see the line totals and grand total update.
- [ ] Add a 10% discount and a note, Review, then Save → the bill is **INV-0001**.
- [ ] Create another bill with the same phone → the name auto-fills ("✓ Existing customer"), and the bill is **INV-0002**.
- [ ] Bills page: search by `0771`, by name, by `INV-0002`; filter by date.
- [ ] Delete a bill.

**Phase 3: sharing**
- [ ] On the bill page, tap **Share on WhatsApp** → WhatsApp opens with the message and link.
- [ ] Open the link in a private/incognito window (logged out) → the bill shows. Changing one character of the link → "Page not found".
- [ ] **Download PDF** → a clean A4 bill with the logo. On Android Chrome, **Share PDF** sends the file into WhatsApp.

**Phase 4: customers**
- [ ] The customers list shows the bill count, total spent and last purchase. Search works.
- [ ] Customer page lists all their bills; "+ New bill for this customer" pre-fills the phone.

**Phase 5: dashboard + export**
- [ ] Dashboard shows today, this month, total bills, the 30-day revenue chart, the busiest days and the top 5 customers.
- [ ] Settings → **Bills CSV** / **Customers CSV** download and open in Excel.

## 5. Deploy to Vercel

1. Push this folder to a GitHub repository.
2. On <https://vercel.com> → **Add New → Project** → import the repository.
3. Under **Environment Variables**, add the same three variables. Set `NEXT_PUBLIC_APP_URL` to your Vercel URL, e.g. `https://billbook.vercel.app`.
4. Click **Deploy**.
5. In Supabase → **Authentication → URL Configuration**: set **Site URL** to the Vercel URL and add `https://billbook.vercel.app/auth/callback` to **Redirect URLs**.

## 6. Install on a phone (PWA)

Open the deployed site on your phone.
- **Android (Chrome):** menu ⋮ → **Install app** / **Add to Home screen**.
- **iPhone (Safari):** Share → **Add to Home Screen**.

## Project layout

```
supabase/migrations/0001_init.sql   ← run in the Supabase SQL editor
src/middleware.ts                   ← session refresh + login protection
src/app/(auth)/                     ← login, signup, auth actions
src/app/onboarding/                 ← first-time business setup
src/app/(app)/                      ← logged-in pages (bottom nav)
   dashboard/  bills/  bills/new/  bills/[id]/  customers/  customers/[id]/  settings/
src/app/b/[token]/                  ← PUBLIC bill page (no login)
src/app/api/export/                 ← CSV downloads
src/components/bill/                ← BillForm, BillView, BillPdf, share/PDF buttons
src/components/charts/              ← Recharts line + bar charts
src/lib/                            ← supabase clients, phone, money/date format, bill math, CSV, WhatsApp
```

## Notes

- **Bill numbers** are created inside the database (`create_bill` function, one transaction with a row lock), so two bills saved at the same moment never get the same number. Deleting a bill does not reuse its number.
- **Totals** are recalculated in the database. The browser's totals are only a preview.
- **Times** are shown and grouped in Sri Lanka time (Asia/Colombo).
- **PDF fonts:** the PDF uses the built-in Helvetica font, so names typed in Sinhala or Tamil will not show in the PDF. They do show correctly on the web bill page and in CSV exports. Supporting them in the PDF needs a Noto Sans Sinhala/Tamil font registered in `BillPdf.tsx`.
