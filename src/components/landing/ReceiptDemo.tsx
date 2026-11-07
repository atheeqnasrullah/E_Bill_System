'use client';

import { useEffect, useState } from 'react';

// Interactive illustration: the same purchase as a fading paper slip,
// a digital bill on WhatsApp, and a saved customer record.

const ITEMS = [
  { qty: 2, name: 'Basmathi Rice 5kg', amt: 4300 },
  { qty: 1, name: 'Coconut Oil 1L', amt: 1150 },
  { qty: 3, name: 'Milk Powder 400g', amt: 3450 },
];
const TOTAL = ITEMS.reduce((s, i) => s + i.amt, 0);
const rs = (n: number) => n.toLocaleString('en-LK', { minimumFractionDigits: 2 });

const TABS = [
  {
    key: 'paper',
    label: 'Paper bill',
    title: 'Written at the counter.',
    body: 'Carbon copies smudge, thermal slips fade, and the bill book fills up. When a customer comes back for a return or warranty, the record is gone.',
  },
  {
    key: 'digital',
    label: 'Digital bill',
    title: 'Sent in seconds.',
    body: 'Type the items once. BillBook adds it up, numbers the bill and sends a clean link and PDF to the customer on WhatsApp.',
  },
  {
    key: 'record',
    label: 'Customer record',
    title: 'Kept for good.',
    body: 'Every bill is filed under the customer’s phone number, so you can see their full history and total spend any time.',
  },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function ReceiptDemo() {
  const [tab, setTab] = useState<TabKey>('paper');
  const [auto, setAuto] = useState(true);
  const active = TABS.find((t) => t.key === tab)!;

  // Cycle through the tabs until the visitor clicks one.
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      setTab((t) => TABS[(TABS.findIndex((x) => x.key === t) + 1) % TABS.length].key);
    }, 4500);
    return () => clearInterval(id);
  }, [auto]);

  return (
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <div>
        <div className="inline-flex rounded-full border border-slate-200 bg-card p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                setAuto(false);
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                tab === t.key ? 'bg-slate-900 text-slate-50' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <h3 className="mt-6 text-xl font-semibold">{active.title}</h3>
        <p className="mt-2 max-w-md leading-relaxed text-slate-500">{active.body}</p>
        <div className="mt-6 flex gap-2">
          {TABS.map((t) => (
            <span key={t.key} className={`h-0.5 w-10 rounded ${tab === t.key ? 'bg-slate-900' : 'bg-slate-300'}`} />
          ))}
        </div>
      </div>

      <div className="flex min-h-[340px] items-center justify-center">
        {tab === 'paper' && <PaperSlip />}
        {tab === 'digital' && <WhatsAppCard />}
        {tab === 'record' && <CustomerRecord />}
      </div>
    </div>
  );
}

function PaperSlip() {
  return (
    <div className="receipt-edge w-72 rotate-2 bg-[#efe9dc] px-6 py-8 font-mono text-[11px] text-[#3d3a33] shadow-2xl transition">
      <p className="text-center text-sm font-bold tracking-widest">SAMAN STORES</p>
      <p className="text-center text-[10px] opacity-70">Kandy Road, Kadawatha</p>
      <div className="my-3 border-t border-dashed border-[#3d3a33]/40" />
      <div className="flex justify-between opacity-80">
        <span>No. 0418</span>
        <span>08/11/26 · 10:24</span>
      </div>
      <div className="my-3 border-t border-dashed border-[#3d3a33]/40" />
      {ITEMS.map((i) => (
        <div key={i.name} className="flex justify-between py-0.5">
          <span>
            {i.qty} {i.name.toUpperCase()}
          </span>
          <span>{rs(i.amt)}</span>
        </div>
      ))}
      <div className="my-3 border-t border-dashed border-[#3d3a33]/40" />
      <div className="flex justify-between font-bold">
        <span>TOTAL</span>
        <span>{rs(TOTAL)}</span>
      </div>
      <p className="mt-4 text-center text-[10px] tracking-widest opacity-50">THANK YOU · COME AGAIN</p>
    </div>
  );
}

function WhatsAppCard() {
  return (
    <div className="w-80 rounded-3xl border border-slate-200 bg-[#0b141a] p-4 shadow-2xl">
      <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">SS</div>
        <div>
          <p className="text-sm font-semibold text-white">Saman Stores</p>
          <p className="text-[10px] text-white/50">online</p>
        </div>
      </div>
      <div className="ml-auto max-w-[90%] rounded-xl rounded-tr-sm bg-[#005c4b] p-3 text-[13px] leading-snug text-white">
        Hi Nimal, here is your bill <b>INV-0418</b> from Saman Stores for <b>Rs. {rs(TOTAL)}</b>:
        <span className="mt-1 block truncate text-[#53bdeb] underline">billbook.app/b/x7Kq2vR9…</span>
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-black/20 p-2">
          <span className="rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">PDF</span>
          <span className="text-xs">INV-0418.pdf · 1 page</span>
        </div>
        <p className="mt-1 text-right text-[10px] text-white/60">10:24 ✓✓</p>
      </div>
    </div>
  );
}

function CustomerRecord() {
  const history = [
    { no: 'INV-0418', date: '08 Nov', amt: TOTAL },
    { no: 'INV-0371', date: '29 Oct', amt: 6250 },
    { no: 'INV-0302', date: '14 Oct', amt: 3980 },
  ];
  return (
    <div className="w-80 rounded-2xl border border-slate-200 bg-card p-5 shadow-2xl">
      <p className="text-lg font-bold">Nimal Perera</p>
      <p className="text-sm text-slate-500">077 123 4567</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-slate-100 p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Bills</p>
          <p className="text-lg font-bold">12</p>
        </div>
        <div className="rounded-xl bg-slate-100 p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Total spent</p>
          <p className="text-lg font-bold">Rs. 64,320</p>
        </div>
      </div>
      <ul className="mt-4 divide-y divide-slate-100 text-sm">
        {history.map((h) => (
          <li key={h.no} className="flex justify-between py-2">
            <span>
              <span className="font-mono">{h.no}</span> <span className="text-slate-500">· {h.date}</span>
            </span>
            <span className="font-semibold">Rs. {rs(h.amt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
