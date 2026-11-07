'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import type { AuthState } from './actions';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? 'Please wait…' : label}
    </button>
  );
}

/** Shared email + password form for /login and /signup. */
export default function AuthForm({
  mode,
  action,
}: {
  mode: 'login' | 'signup';
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
}) {
  const [state, formAction] = useFormState(action, undefined);
  const isLogin = mode === 'login';

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <Link href="/" className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-xl font-extrabold text-white">
          Rs
        </Link>
        <h1 className="text-2xl font-bold">BillBook</h1>
        <p className="mt-1 text-slate-600">{isLogin ? 'Log in to your shop' : 'Create your shop account'}</p>
      </div>

      <form action={formAction} className="card space-y-4">
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required className="input" />
        </div>
        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            minLength={6}
            required
            className="input"
          />
        </div>

        {state?.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
        {state?.message && <p className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">{state.message}</p>}

        <Submit label={isLogin ? 'Log in' : 'Sign up'} />
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        {isLogin ? (
          <>
            New here?{' '}
            <Link href="/signup" className="font-semibold text-brand-700">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-brand-700">
              Log in
            </Link>
          </>
        )}
      </p>
    </main>
  );
}
