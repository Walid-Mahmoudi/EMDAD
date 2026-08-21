import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/supabase/server';
import CrmShell from '@/components/CrmShell';

export default async function AdminPage() {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect('/login');
  if (!profile?.is_active || profile.role !== 'admin') redirect('/employee');
  return <CrmShell profile={profile} />;
}
