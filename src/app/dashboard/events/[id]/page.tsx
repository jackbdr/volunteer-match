import { JSX } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EventDetails from '@/components/events/EventDetails';
import { prisma } from '@/lib/db/prisma';

interface EventDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailsPage({ params }: EventDetailsPageProps): Promise<JSX.Element> {
  const resolvedParams = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/signin');
  }

  if (user.role === 'ADMIN') {
    return (
      <DashboardLayout user={user}>
        <EventDetails eventId={resolvedParams.id} isAdmin={true} />
      </DashboardLayout>
    );
  }

  const volunteer = await prisma.volunteer.findUnique({
    where: { userId: user.id },
  });

  if (!volunteer) {
    redirect('/dashboard');
  }

  const match = await prisma.eventMatch.findFirst({
    where: {
      eventId: resolvedParams.id,
      volunteerId: volunteer.id,
    },
  });

  if (!match) {
    redirect('/dashboard');
  }

  return (
    <DashboardLayout user={user}>
      <EventDetails eventId={resolvedParams.id} isAdmin={false} />
    </DashboardLayout>
  );
}