# BillBook — Architecture

> A digital bill book for small shops in Sri Lanka. A shop owner creates a bill on their phone, shares it with the customer on WhatsApp (link + PDF), and every bill is stored under the customer's phone number. It replaces the paper bill book.
>
> Inspiration: [wbill.app](https://wbill.app/), a phone-number-centric billing product. BillBook is our own implementation for the Sri Lankan market (LKR, +94 numbers).

---

## 1. Goals and non-goals

**Goals**
- Create a bill in under 30 seconds on a phone at the counter.
- The customer needs no app or account: they get a link and a PDF.
- Customers are identified **only by mobile number** (`+947XXXXXXXX`).
- Each shop sees only its own data (enforced in the database with RLS, not only in the UI).
- Bill numbers are sequential per shop, without gaps or duplicates under concurrency.
- Runs as an installable PWA and deploys to Vercel with no server to manage.

**Non-goals (v1)**
- Payments / payment gateway, inventory, tax (VAT) lines, multi-user staff accounts, offline bill creation. See §12, Future work.

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14 (App Router) + TypeScript** | Server Components for fast reads, Server Actions for writes, one deploy target |
| Styling | **Tailwind CSS** | Mobile-first utility classes, small CSS bundle |
| Auth + DB | **Supabase** (Auth, Postgres, Storage) | Email/password auth, RLS, Postgres functions, logo storage |
| Supabase client | `@supabase/ssr` + `@supabase/supabase-js` | Cookie-based sessions that work in Server Components, middleware, and the browser |
| Charts | **Recharts** | Simple React charts (line + bar) |
| PDF | **@react-pdf/renderer** | Builds the PDF from React components on the client, so no server-side Chromium is needed |
| Validation | **zod** | Validates form data in Server Actions |
| PWA | `manifest.webmanifest` + a small service worker (or `next-pwa`) | Installable on Android/iOS home screens |
| Hosting | **Vercel** | Zero-config Next.js hosting |

---

## 3. High-level architecture

```
 ┌──────────────────────────────┐          ┌────────────────────────────────────┐
 │  Shop owner's phone (PWA)    │          │  Customer's phone (no account)     │
 │  Next.js client components   │          │  WhatsApp → opens /b/[token]       │
 └──────────────┬───────────────┘          └──────────────────┬─────────────────┘
                │ HTTPS (cookies = Supabase session)          │ HTTPS (no session)
                ▼                                             ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         Vercel — Next.js 14 App Router                      │
 │                                                                             │
 │  middleware.ts ── refreshes Supabase session, protects /(app)/* routes      │
 │                                                                             │
 │  (auth)   /login /signup            → Server Actions → supabase.auth.*      │
 │  (app)    /dashboard /bills/new ... → Server Components read via RLS        │
 │                                       Server Actions write via RLS / RPC    │
 │  (public) /b/[token]                → RPC get_public_bill(token)            │
 │  /api/export/{bills,customers}      → Route Handlers stream CSV             │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │ supabase-js (anon key + user JWT)
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                                Supabase                                     │
 │  Auth (auth.users)     Postgres + RLS                  Storage              │
 │                        businesses / customers          bucket: logos        │
 │                        bills / bill_items              (public read,        │
 │                        fn create_bill()  (atomic)       owner-only write)   │
 │                        fn get_public_bill(token)                            │
 │                        views / fns for dashboard stats                      │
 └─────────────────────────────────────────────────────────────────────────────┘
```

**Key principle:** the browser and the Next.js server only use the **anon key**. All access control lives in Postgres RLS policies and `SECURITY DEFINER` functions. The **service-role key is never used** in the app.

---

## 4. Folder structure

```
billbook/
├─ .env.local                     # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_APP_URL
├─ .env.example
├─ next.config.mjs
├─ tailwind.config.ts
├─ public/
│  └─ sw.js                       # service worker (caches static build files)
├─ supabase/
│  └─ migrations/
│     └─ 0001_init.sql            # full schema, RLS, functions (run in the SQL editor)
└─ src/
   ├─ middleware.ts               # session refresh + route protection
   ├─ app/
   │  ├─ layout.tsx               # root layout, fonts, <meta theme-color>
   │  ├─ page.tsx                 # redirects → /dashboard or /login
   │  ├─ (auth)/
   │  │  ├─ login/page.tsx
   │  │  ├─ signup/page.tsx
   │  │  └─ actions.ts            # signIn, signUp, signOut server actions
   │  ├─ onboarding/page.tsx      # first-time business profile setup (outside (app) to avoid a redirect loop)
   │  ├─ auth/callback/route.ts   # email-confirmation link → session
   │  ├─ manifest.ts              # PWA manifest
   │  ├─ icons/[size]/route.tsx   # generated PNG app icons (180/192/512)
   │  ├─ (app)/                   # authenticated area
   │  │  ├─ layout.tsx            # requires session + business profile; renders <BottomNav/>
   │  │  ├─ dashboard/page.tsx    # Phase 5
   │  │  ├─ bills/
   │  │  │  ├─ page.tsx           # list + search + date filter
   │  │  │  ├─ new/page.tsx       # create-bill form
   │  │  │  ├─ [id]/page.tsx      # owner's view of a bill (share / PDF / delete)
   │  │  │  └─ actions.ts         # createBill, deleteBill
   │  │  ├─ customers/
   │  │  │  ├─ page.tsx           # grouped list + search
   │  │  │  └─ [id]/page.tsx      # customer detail + their bills
   │  │  └─ settings/page.tsx     # edit business profile, logo, export, sign out
   │  ├─ b/[token]/page.tsx       # PUBLIC bill page (no auth)
   │  └─ api/export/
   │     ├─ bills/route.ts        # GET → CSV
   │     └─ customers/route.ts    # GET → CSV
   ├─ components/
   │  ├─ BottomNav.tsx
   │  ├─ BusinessForm.tsx         # onboarding + settings form, logo upload to Storage
   │  ├─ ServiceWorkerRegister.tsx
   │  ├─ bill/
   │  │  ├─ BillForm.tsx          # client component: line items, totals, discount, review step
   │  │  ├─ BillView.tsx          # shared by owner view + public page
   │  │  ├─ BillPdf.tsx           # @react-pdf/renderer document
   │  │  ├─ PdfButtons.tsx        # Download PDF / Share PDF (lazy-loads the PDF library)
   │  │  ├─ ShareActions.tsx      # WhatsApp, copy link, customer view
   │  │  └─ DeleteBillButton.tsx
   │  └─ charts/
   │     ├─ RevenueLineChart.tsx
   │     └─ WeekdayBarChart.tsx
   ├─ lib/
   │  ├─ supabase/
   │  │  ├─ client.ts             # createBrowserClient
   │  │  ├─ server.ts             # createServerClient (cookies)
   │  │  └─ middleware.ts         # updateSession helper
   │  ├─ actions/business.ts      # saveBusiness server action
   │  ├─ business.ts              # getUser / getBusiness / requireBusiness / getAppUrl
   │  ├─ phone.ts                 # normalizeLkPhone(), formatLkPhone()
   │  ├─ format.ts                # formatRs() → "Rs. 1,250.00"; Colombo date helpers
   │  ├─ bill-calc.ts             # pure functions in cents: line totals, subtotal, discount, total
   │  ├─ whatsapp.ts              # buildBillMessage(), buildWhatsAppUrl()
   │  ├─ csv.ts                   # toCsv() with escaping + BOM
   │  └─ types.ts                 # Business, PublicBill, CustomerSummary, DashboardStats
```

---

## 5. Data model

```
auth.users 1 ── 1 businesses 1 ──< customers 1 ──< bills 1 ──< bill_items
                         └──────────────────────────< bills
```

### Tables

**businesses**
| column | type | notes |
|---|---|---|
| id | uuid PK | `gen_random_uuid()` |
| owner_id | uuid → auth.users | **unique** (one business per owner in v1) |
| name | text not null | |
| logo_url | text | public URL in the `logos` bucket |
| address | text | |
| phone | text | stored as `+947XXXXXXXX` |
| footer_note | text | e.g. "Thank you! Goods once sold cannot be returned." |
| bill_counter | integer not null default 0 | last number issued |
| created_at | timestamptz default now() | |

**customers**
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| business_id | uuid → businesses (on delete cascade) | |
| phone | text not null | E.164 `+947XXXXXXXX`, checked with `^\+947\d{8}$` |
| name | text | optional; updated when a later bill supplies a name |
| created_at | timestamptz | |
| | | **unique (business_id, phone)** |

**bills**
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| business_id | uuid → businesses (cascade) | |
| customer_id | uuid → customers (restrict) | |
| bill_number | text not null | `INV-0001`; **unique (business_id, bill_number)** |
| public_token | text not null unique | 32-char random URL-safe string (~190 bits) |
| subtotal | numeric(12,2) | |
| discount | numeric(12,2) default 0 | always stored as an **amount** |
| discount_type | text | `'amount' \| 'percent' \| null`, for display |
| discount_value | numeric(12,2) | the value the user typed (e.g. 10 for 10%) |
| total | numeric(12,2) | `subtotal - discount`, `>= 0` |
| note | text | |
| created_at | timestamptz | |

**bill_items**
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| bill_id | uuid → bills (cascade) | |
| position | smallint | keeps line order |
| item_name | text not null | |
| quantity | numeric(10,3) | `> 0`; allows 1.5 kg |
| unit_price | numeric(12,2) | `>= 0` |
| line_total | numeric(12,2) | `quantity * unit_price`, rounded |

### Indexes
- `customers (business_id, phone)` unique, used for lookup and auto-fill
- `customers (business_id, name)`, `pg_trgm` index for name search
- `bills (business_id, created_at desc)` for history, date filter, and dashboard
- `bills (customer_id, created_at desc)` for the customer detail page
- `bills (public_token)` unique
- `bill_items (bill_id)`

### Money
- Postgres stores money as `numeric(12,2)`, **never float**.
- In TypeScript, calculations are done in **cents (integers)** in `bill-calc.ts` and converted for display only.
- The server **recomputes** all totals inside `create_bill()`. Client totals are only a preview and are never trusted.

---

## 6. Security model (RLS)

All four tables have **RLS enabled**. The ownership check is a single helper:

```sql
create function public.my_business_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from businesses where owner_id = auth.uid()
$$;
```

| table | select | insert | update | delete |
|---|---|---|---|---|
| businesses | `owner_id = auth.uid()` | `owner_id = auth.uid()` | same (but `bill_counter` is changed only by `create_bill`) | no |
| customers | `business_id = my_business_id()` | same | same | same |
| bills | `business_id = my_business_id()` | only through `create_bill()` RPC | no (bills are immutable) | same |
| bill_items | via parent bill's business | only through `create_bill()` | no | cascade with bill |

**Public bill page.** `anon` gets **no** select policy on any table. Instead:

```sql
create function public.get_public_bill(p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  -- returns one bill + its items + business display fields + customer name,
  -- or null. Never exposes ids, owner_id, bill_counter, or other bills.
$$;
grant execute on function public.get_public_bill(text) to anon, authenticated;
```

This means a token lets someone read exactly one bill. Listing bills or guessing ids is impossible.

**Storage.** Bucket `logos` is public-read. Writes are allowed only to the path `logos/{auth.uid()}/*`.

**Secrets.** Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are used. Both are safe to expose because RLS enforces access.

---

## 7. Bill numbering (concurrency-safe)

Bills are created through **one Postgres function** that runs as a single transaction:

```
create_bill(p_phone, p_customer_name, p_items jsonb, p_discount_type, p_discount_value, p_note)
  returns (id, bill_number, public_token)

1. biz := my_business_id()                         -- raises if none
2. UPDATE businesses SET bill_counter = bill_counter + 1
     WHERE id = biz RETURNING bill_counter INTO n;  -- row lock serializes concurrent calls
3. bill_number := 'INV-' || lpad(n::text, 4, '0')   -- INV-0001 … INV-9999, then INV-10000
4. UPSERT customer ON CONFLICT (business_id, phone)
     DO UPDATE SET name = coalesce(nullif(excluded.name,''), customers.name)
5. Validate items, compute line_total / subtotal / discount / total server-side
6. INSERT bill (public_token := encode(gen_random_bytes(24), 'base64') made URL-safe)
7. INSERT bill_items
8. RETURN
```

- The `UPDATE … RETURNING` takes a row lock on the business row, so two simultaneous bills wait for each other and get N and N+1.
- If anything fails, the whole transaction rolls back, including the counter, so **no gaps and no duplicates**.
- `unique (business_id, bill_number)` is a final safety net.

---

## 8. Key flows

### 8.1 Sign up → onboarding
```
/signup → supabase.auth.signUp → (email confirm, optional) → /login
→ middleware sees session → (app)/layout checks a businesses row exists
   no  → /onboarding (name, logo upload → Storage, address, phone, footer) → insert businesses
   yes → /dashboard
```

### 8.2 Create bill (Phase 2)
```
BillForm (client)
 ├─ phone input → normalizeLkPhone("0771234567") = "+94771234567"
 │    on blur → select name from customers where phone = ? → auto-fill name
 ├─ line items: add/remove rows; live line totals + grand total (bill-calc.ts)
 ├─ discount: toggle Rs / %, optional note
 ├─ Preview → Save
 └─ Server Action createBill(formData)
       zod validate → supabase.rpc('create_bill', …) → redirect /bills/[id]?new=1
```

Phone normalization accepts `0771234567`, `771234567`, `+94771234567`, and `94 77 123 4567`. The result is `+947XXXXXXXX`; anything else is rejected with a friendly error.

### 8.3 Share (Phase 3)
```
/bills/[id] (owner) and /b/[token] (public) both render <BillView/>

Download PDF:  dynamic import BillPdf → pdf(<BillPdf/>).toBlob() → download "INV-0012.pdf"
WhatsApp:      https://wa.me/94771234567?text=<encodeURIComponent(message)>
               message = "Hi Kamal, here is your bill INV-0012 from Sunil Stores
                          for Rs. 4,500.00: https://billbook.lk/b/<token>"
```
- `wa.me` needs the number **without** `+`.
- The public URL is built from `NEXT_PUBLIC_APP_URL`.
- On phones that support it, the Web Share API (`navigator.share({ files: [pdf] })`) can also share the PDF file directly as a progressive enhancement.
- `/b/[token]` sets `robots: noindex` and has no auth chrome.

### 8.4 Customers (Phase 4)
The list is one query over a view or RPC:
```sql
select c.id, c.phone, c.name,
       count(b.id) as bill_count, coalesce(sum(b.total),0) as total_spent,
       max(b.created_at) as last_purchase
from customers c left join bills b on b.customer_id = c.id
where c.business_id = my_business_id()
group by c.id order by last_purchase desc nulls last;
```
Search uses `phone ilike '%q%' or name ilike '%q%'`. The detail page shows the customer's bills, newest first.

### 8.5 Dashboard (Phase 5)
One RPC, `dashboard_stats()`, returns JSON so the page makes a single round trip:
- `today_sales`, `month_sales`, `total_bills`
- `daily_revenue_30d`: `generate_series` over 30 days, left-joined so zero days show up
- `weekday_counts`: `extract(dow from created_at at time zone 'Asia/Colombo')`
- `top_customers`: top 5 by `sum(total)`

**All date bucketing uses `Asia/Colombo`**, so "today" matches the shop's day rather than UTC.

### 8.6 CSV export (Phase 5)
`GET /api/export/bills?from=&to=` and `GET /api/export/customers` are Route Handlers. They use the user's session, so RLS still applies, and return `text/csv` with `Content-Disposition: attachment`. The CSV starts with a UTF-8 BOM so Excel opens Sinhala/Tamil names correctly.

---

## 9. Routing and auth guard

| route | access | rendered |
|---|---|---|
| `/login`, `/signup` | guests only (logged-in users go to `/dashboard`) | server + action |
| `/onboarding` | logged in, no business yet | client form |
| `/dashboard`, `/bills/**`, `/customers/**`, `/settings` | logged in + business | Server Components |
| `/b/[token]` | public | Server Component, `dynamic = 'force-dynamic'` |
| `/api/export/*` | logged in | Route Handler |

`middleware.ts` refreshes the Supabase session cookie on every request and redirects unauthenticated users away from `(app)` routes.

---

## 10. UI / UX

- **Mobile-first**, max content width about 640px, centred on desktop.
- **Bottom nav** (fixed, safe-area aware): Dashboard · **New Bill** (prominent centre button) · Bills · Customers · Settings.
- Tap targets ≥ 48px; the phone field uses `inputMode="tel"` and price fields use `inputMode="decimal"`.
- Money is always shown with `formatRs(n)` → `Rs. 1,250.00` (`en-LK` grouping, two decimals).
- Dates are shown as `08 Nov 2026, 3:45 PM`, Asia/Colombo.
- Empty, loading (`loading.tsx` skeletons), and error (`error.tsx`) states on every page.
- PWA: `display: standalone`, theme colour, app icons, and a cached app shell so the app opens fast even on weak connections.

---

## 11. Environment and commands

`.env.local` (project root, never committed):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co     # Supabase → Project Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>                # same page
NEXT_PUBLIC_APP_URL=http://localhost:3000                      # set to the Vercel URL in production
```

```bash
npx create-next-app@14 billbook --typescript --tailwind --app --src-dir --eslint
cd billbook
npm i @supabase/supabase-js @supabase/ssr zod recharts @react-pdf/renderer
npm run dev
```

Database: open Supabase → SQL Editor, paste `supabase/migrations/0001_init.sql`, and click Run. Then create the Storage bucket `logos` (or let the migration create it).

Deploy: push to GitHub, import the repo in Vercel, add the three env vars, and deploy. In Supabase → Auth → URL Configuration, add the Vercel URL as the Site URL.

---

## 12. Build phases

| Phase | Scope | Done when |
|---|---|---|
| **1** | Project setup, Supabase clients, middleware, signup/login/logout, onboarding + settings (logo upload), bottom nav shell, full SQL migration | You can sign up, create a profile, see the logo in Settings |
| **2** | `create_bill` RPC, BillForm (phone normalize + auto-fill, items, discount, note), bills list with search + date filter, delete | Two bills saved quickly get INV-0001 / INV-0002 |
| **3** | `/b/[token]` public page, BillPdf download, WhatsApp share, re-share from history | A customer opens the link on another phone without logging in |
| **4** | Customers list (aggregates + search), customer detail | Totals match the sum of that customer's bills |
| **5** | `dashboard_stats` RPC, Recharts line + bar, top-5 customers, CSV export, PWA polish | Dashboard numbers match the bills list; CSV opens in Excel |

**Work rule:** stop after each phase for testing before starting the next.

---

## 13. Future work (not in v1)

- Saved item catalogue with quick-add (frequently sold items)
- Tax/VAT lines, multiple discount lines
- Payment status (paid / credit) and outstanding balance per customer, for shops that give credit
- Staff accounts (multiple users per business with roles)
- Offline bill drafts with background sync
- SMS fallback for customers without WhatsApp
- Sinhala / Tamil UI translations
- Warranty records and order tracking per bill
