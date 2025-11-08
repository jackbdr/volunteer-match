import { JSX } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EventDetails from '@/components/events/EventDetails';

interface EventDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailsPage({ params }: EventDetailsPageProps): Promise<JSX.Element> {
  const resolvedParams = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/signin');
  }

  if (user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <DashboardLayout user={user}>
      <EventDetails eventId={resolvedParams.id} />
    </DashboardLayout>
  );
}