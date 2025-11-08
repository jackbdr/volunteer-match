import { JSX } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import VolunteerDashboard from '@/components/dashboard/VolunteerDashboard';

export default async function DashboardPage(): Promise<JSX.Element> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <DashboardLayout user={user}>
      {user.role === 'ADMIN' ? (
        <AdminDashboard user={user} />
      ) : (
        <VolunteerDashboard user={user} />
      )}
    </DashboardLayout>
  );
}
