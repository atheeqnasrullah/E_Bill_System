import Link from 'next/link';

/** BillBook logo mark + name. */
export default function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 font-bold tracking-tight text-slate-900">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-[13px] font-extrabold text-white">Rs</span>
      <span className="text-lg">BillBook</span>
    </Link>
  );
}
