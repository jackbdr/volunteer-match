import { JSX } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import VolunteerProfileForm from '@/components/profile/VolunteerProfileForm';

export default async function ProfilePage(): Promise<JSX.Element> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/signin');
  }

  if (user.role !== 'VOLUNTEER') {
    redirect('/dashboard');
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600 mt-1">
                Complete your profile to get better matched to volunteer opportunities
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Volunteer Profile</span>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <VolunteerProfileForm user={user} />
      </div>
    </DashboardLayout>
  );
}