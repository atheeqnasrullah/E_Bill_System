import BusinessForm from '@/components/BusinessForm';
import { requireBusiness } from '@/lib/business';
import { formatLkPhone } from '@/lib/phone';
import { signOut } from '@/app/(auth)/actions';

export const metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const { business, role, email } = await requireBusiness();
  const isOwner = role === 'owner';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Profile</h1>
        <p className="text-sm text-slate-500">
          Signed in as {email} · {isOwner ? 'Owner' : 'Employee'}
        </p>
      </div>

      <section>
        <h2 className="mb-2 font-semibold text-slate-700">Business profile</h2>
        {isOwner ? (
          <BusinessForm userId={business.owner_id} initial={business} mode="edit" />
        ) : (
          <div className="card space-y-1">
            {business.logo_url && <img src={business.logo_url} alt="" className="mb-2 h-16 w-16 rounded-lg object-contain" />}
            <p className="text-lg font-bold">{business.name}</p>
            {business.address && <p className="text-sm text-slate-600">{business.address}</p>}
            {business.phone && <p className="text-sm text-slate-600">{formatLkPhone(business.phone)}</p>}
            <p className="pt-2 text-xs text-slate-500">Only the shop owner can change these details.</p>
          </div>
        )}
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold text-slate-700">Your data</h2>
        <p className="text-sm text-slate-600">Your bills and customer records belong to you. Download them any time to open in Excel or Google Sheets.</p>
        <div className="grid grid-cols-2 gap-3">
          <a href="/api/export/bills" className="btn-secondary">
            Bills CSV
          </a>
          <a href="/api/export/customers" className="btn-secondary">
            Customers CSV
          </a>
        </div>
      </section>

      <form action={signOut}>
        <button type="submit" className="btn-danger w-full">
          Log out
        </button>
      </form>
    </div>
  );
}
