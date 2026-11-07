import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-5xl">🧾</p>
      <h1 className="text-xl font-bold">Page not found</h1>
      <p className="text-slate-600">This bill or page does not exist, or the link is incomplete.</p>
      <Link href="/" className="btn-secondary">
        Go home
      </Link>
    </main>
  );
}
