import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/business';
import { formatDate } from '@/lib/format';
import type { Member } from '@/lib/types';
import AddEmployeeForm from './AddEmployeeForm';
import { removeEmployee } from './actions';

export const metadata = { title: 'Employees' };

export default async function EmployeesPage() {
  const { role, email: myEmail } = await requireBusiness();
  const supabase = createClient();
  const { data, error } = await supabase.from('business_members').select('id, email, user_id, role, created_at').order('created_at');
  const members = (data ?? []) as Member[];
  const isOwner = role === 'owner';

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Employees</h1>
        <p className="text-sm text-slate-500">Let your staff create bills from their own phones.</p>
      </div>

      {isOwner ? (
        <>
          <AddEmployeeForm />
          <div className="card space-y-2 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">How it works</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Add your employee&apos;s email above.</li>
              <li>They open BillBook and sign up with that same email.</li>
              <li>They go straight into your shop and can create bills.</li>
            </ol>
            <p className="pt-1 text-xs text-slate-500">
              Employees can create and share bills, see customers and items. Only you can edit the shop profile, delete bills and manage the
              team. For safety, keep <b>Confirm email</b> turned ON in Supabase when you add real employees.
            </p>
          </div>
        </>
      ) : (
        <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-600">Only the shop owner can add or remove employees.</p>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error.message.includes('business_members') ? 'Run the second SQL file (0002) in Supabase to enable Employees.' : error.message}
        </p>
      )}

      <ul className="card divide-y divide-slate-100 p-0">
        <li className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="font-medium">{isOwner ? myEmail : 'Shop owner'}</p>
            <p className="text-xs text-slate-500">Owner</p>
          </div>
        </li>
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{m.email}</p>
              <p className="text-xs text-slate-500">
                {m.user_id ? 'Employee · active' : 'Invited · waiting to sign up'} · added {formatDate(m.created_at)}
              </p>
            </div>
            {isOwner && (
              <form action={removeEmployee.bind(null, m.id)}>
                <button type="submit" className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                  Remove
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
