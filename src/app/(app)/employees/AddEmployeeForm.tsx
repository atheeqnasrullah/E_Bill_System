'use client';

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { addEmployee, type FormState } from './actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? 'Adding…' : '+ Add employee'}
    </button>
  );
}

export default function AddEmployeeForm() {
  const [state, action] = useFormState<FormState, FormData>(addEmployee, undefined);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="card space-y-3">
      <h2 className="font-semibold">Add an employee</h2>
      <input name="email" type="email" required placeholder="employee@email.com" className="input" />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-brand-700">✓ {state.ok}</p>}
      <Submit />
    </form>
  );
}
