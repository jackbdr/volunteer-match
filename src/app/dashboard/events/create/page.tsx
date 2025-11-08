import { JSX } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EventCreateForm from '@/components/events/EventCreateForm';

export default async function CreateEventPage(): Promise<JSX.Element> {
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
              <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
              <p className="text-gray-600 mt-1">
                Set up a new volunteer opportunity. Virtual events will automatically get Zoom meetings.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Zoom Integration Active</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <EventCreateForm />
      </div>
    </DashboardLayout>
  );
}