import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth-handler';
import { eventService } from '@/lib/services/event.service';
import { UserRole } from '@prisma/client';

/**
 * POST /api/events/[id]/invite?matchId=xxx
 * Send invitation email to a specific matched volunteer
 * Admin only
 */
export const POST = withAuth(async (user, request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const params = await context.params;
  const eventId = params.id;
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');

  if (!matchId) {
    return NextResponse.json(
      { error: 'matchId is required' },
      { status: 400 }
    );
  }

  await eventService.sendInvitation(eventId, matchId, user);

  return NextResponse.json({
    success: true,
    message: 'Invitation sent successfully',
  }, { status: 200 });
}, UserRole.ADMIN);
