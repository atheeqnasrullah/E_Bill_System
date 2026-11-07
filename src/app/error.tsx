'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="text-sm text-slate-600">{error.message || 'Please try again.'}</p>
      <button onClick={reset} className="btn-primary">
        Try again
      </button>
    </main>
  );
}
