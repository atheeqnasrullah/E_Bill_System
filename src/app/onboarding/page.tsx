import { redirect } from 'next/navigation';
import BusinessForm from '@/components/BusinessForm';
import { getBusiness, getUser } from '@/lib/business';

export const metadata = { title: 'Set up your shop' };

// First screen after sign-up: create the business profile.
export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  if (await getBusiness()) redirect('/dashboard');

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="page-title">Set up your shop</h1>
      <p className="mb-6 mt-1 text-slate-600">These details appear on every bill you send.</p>
      <BusinessForm userId={user.id} mode="create" />
    </main>
  );
}
