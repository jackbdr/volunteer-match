import { JSX } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import VolunteerEventDetails from '@/components/volunteers/VolunteerEventDetails';

interface OpportunityDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function OpportunityDetailsPage({ params }: OpportunityDetailsPageProps): Promise<JSX.Element> {
  const resolvedParams = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/signin');
  }

  if (user.role !== 'VOLUNTEER') {
    redirect('/dashboard');
  }

  return (
    <DashboardLayout user={user}>
      <VolunteerEventDetails eventId={resolvedParams.id} />
    </DashboardLayout>
  );
}
