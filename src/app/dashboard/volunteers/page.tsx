import { JSX } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import VolunteersList from '@/components/volunteers/VolunteersList';

export default async function VolunteersPage(): Promise<JSX.Element> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/signin');
  }

  if (user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Volunteers</h1>
              <p className="text-gray-600 mt-1">
                View and manage all registered volunteers
              </p>
            </div>
          </div>
        </div>

        {/* Volunteers List */}
        <VolunteersList />
      </div>
    </DashboardLayout>
  );
}
