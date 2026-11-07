import Link from 'next/link';
import Logo from '@/components/Logo';
import ReceiptDemo from '@/components/landing/ReceiptDemo';
import { getUser } from '@/lib/business';

// Public home page (marketing). Logged-in users see a "Dashboard" button.

const STEPS = [
  { n: '01', title: 'Create the bill', body: 'Type the customer’s mobile number and add items. Saved items fill in their price, and the total updates as you type.' },
  { n: '02', title: 'Send it on WhatsApp', body: 'One tap opens WhatsApp with the bill link ready. On phones you can send the PDF file too.' },
  { n: '03', title: 'Customer keeps it', body: 'They open a clean bill with your logo. No app, no account. They can save it, print it or forward it.' },
  { n: '04', title: 'It’s filed for you', body: 'The bill is saved under the customer’s number and counted in your daily and monthly sales.' },
];

const FEATURES = [
  { icon: '🧾', title: 'Auto bill numbers', body: 'INV-0001, INV-0002… Numbered by the database, so two bills never get the same number.' },
  { icon: '💬', title: 'WhatsApp sharing', body: 'Send a link or PDF straight to the customer’s WhatsApp.' },
  { icon: '👥', title: 'Customer history', body: 'Every customer by phone number, with bill count, total spent and last visit.' },
  { icon: '📦', title: 'My items', body: 'Your price list builds itself as you bill. Pick items instead of typing them.' },
  { icon: '📈', title: 'Insights', body: 'Today’s sales, monthly revenue, busiest days and your best customers.' },
  { icon: '🧑‍🤝‍🧑', title: 'Employees', body: 'Let staff create bills from their own phones. Only you manage the shop.' },
  { icon: '⬇️', title: 'Your data', body: 'Export bills and customers to Excel (CSV) any time.' },
  { icon: '📱', title: 'Works on any phone', body: 'Install it on your home screen like an app. Big buttons, built for the counter.' },
];

const FAQ = [
  {
    q: 'Does my customer need to install anything?',
    a: 'No. They get a WhatsApp message with a link. The bill opens in their browser and they can download it as a PDF.',
  },
  { q: 'Can I use it on my phone?', a: 'Yes. BillBook is made for phones first. Open it in Chrome or Safari and add it to your home screen.' },
  {
    q: 'Who can see my bills?',
    a: 'Only you and the employees you add. Each customer can only open their own bill through its private link.',
  },
  { q: 'Can I get my data out?', a: 'Yes. Download all bills and customers as CSV files from your Profile page whenever you want.' },
  { q: 'What does it cost?', a: 'BillBook is free while we are getting started. We will tell you well before any paid plan begins.' },
];

export default async function HomePage() {
  const user = await getUser();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-slate-50/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-slate-500 md:flex">
            <a href="#product" className="hover:text-slate-900">Product</a>
            <a href="#how" className="hover:text-slate-900">How it works</a>
            <a href="#pricing" className="hover:text-slate-900">Pricing</a>
            <a href="#faq" className="hover:text-slate-900">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard" className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-slate-50 hover:opacity-90">
                Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 sm:block">
                  Login
                </Link>
                <Link href="/signup" className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500">
                  Get started →
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(rgb(var(--slate-900))_1px,transparent_1px)] [background-size:22px_22px]"
        />
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[120px]" />
        <div className="relative mx-auto max-w-4xl px-4 pb-24 pt-20 text-center sm:pt-28">
          <p className="eyebrow justify-center">Digital bill book for Sri Lankan shops</p>
          <h1 className="mt-6 text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
            Close the paper
            <br />
            bill book.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">
            Make a bill in seconds, send it to your customer on WhatsApp, and keep every sale organised by phone number. No printer, no
            carbon paper, nothing lost.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href={user ? '/dashboard' : '/signup'} className="rounded-full bg-brand-600 px-7 py-3.5 font-semibold text-white hover:bg-brand-500">
              {user ? 'Open dashboard →' : 'Start free →'}
            </Link>
            <a href="#product" className="rounded-full border border-slate-300 px-7 py-3.5 font-semibold text-slate-800 hover:bg-slate-100">
              See how it works
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-400">Free to start · No card needed · Works on any phone</p>
        </div>
      </section>

      {/* Paper → digital */}
      <section id="product" className="border-t border-slate-200/60 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <p className="eyebrow">From paper to digital</p>
          <h2 className="mt-4 max-w-xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            One sale. One record that lasts.
          </h2>
          <p className="mt-4 max-w-xl text-slate-500">
            A bill is the proof of a purchase for you and your customer. BillBook keeps it safe, searchable and easy to share.
          </p>
          <div className="mt-14">
            <ReceiptDemo />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-slate-200/60 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight">Four steps. Under a minute.</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="card p-6">
                <p className="font-mono text-sm text-brand-700">{s.n}</p>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-200/60 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <p className="eyebrow">Everything a shop needs</p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight">Simple tools, built for the counter.</h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-card p-6">
                <p className="text-2xl">{f.icon}</p>
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-slate-200/60 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <p className="eyebrow">Pricing</p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight">Free while we grow.</h2>
          <p className="mt-3 max-w-xl text-slate-500">Every shop starts on the free plan with all features. No card needed.</p>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <div className="card relative border-brand-600/50 p-8">
              <span className="absolute right-6 top-6 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">Available now</span>
              <h3 className="text-lg font-semibold">Free</h3>
              <p className="mt-2 text-4xl font-extrabold">
                Rs. 0<span className="text-base font-medium text-slate-500"> / month</span>
              </p>
              <ul className="mt-6 space-y-2 text-sm text-slate-600">
                {['Unlimited digital bills', 'WhatsApp link + PDF sharing', 'Customer records & history', 'My items price list', 'Insights dashboard', 'Employees', 'CSV export'].map((x) => (
                  <li key={x}>✓ {x}</li>
                ))}
              </ul>
              <Link href={user ? '/dashboard' : '/signup'} className="btn-primary mt-8 w-full">
                {user ? 'Open dashboard' : 'Start free'}
              </Link>
            </div>
            <div className="card p-8 opacity-80">
              <span className="float-right rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-500">Coming later</span>
              <h3 className="text-lg font-semibold">Pro</h3>
              <p className="mt-2 text-4xl font-extrabold text-slate-500">Soon</p>
              <ul className="mt-6 space-y-2 text-sm text-slate-500">
                {['SMS bills for customers without WhatsApp', 'Warranty & return tracking', 'Credit (pay later) balances', 'Sinhala & Tamil bills', 'Priority support'].map((x) => (
                  <li key={x}>○ {x}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-slate-200/60 py-24">
        <div className="mx-auto max-w-3xl px-4">
          <p className="eyebrow">FAQ</p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight">Questions</h2>
          <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                  {f.q}
                  <span className="ml-4 text-slate-400 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-slate-500">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-200/60 py-24">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Your next bill can be digital.</h2>
          <Link href={user ? '/bills/new' : '/signup'} className="mt-8 inline-flex rounded-full bg-brand-600 px-8 py-4 font-semibold text-white hover:bg-brand-500">
            {user ? 'Create a bill →' : 'Get started free →'}
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200/60 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row">
          <Logo />
          <p>© {new Date().getFullYear()} BillBook · Made in Sri Lanka 🇱🇰</p>
        </div>
      </footer>
    </div>
  );
}
