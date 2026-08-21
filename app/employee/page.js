import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/supabase/server';
import CrmShell from '@/components/CrmShell';

export default async function EmployeePage() {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect('/login');
  if (!profile?.is_active) redirect('/login');
  if (profile.role === 'admin') redirect('/admin');
  return <CrmShell profile={profile} />;
}
