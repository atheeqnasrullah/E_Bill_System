import { redirect } from 'next/navigation';

// "Settings" was renamed to "Profile".
export default function SettingsPage() {
  redirect('/profile');
}
