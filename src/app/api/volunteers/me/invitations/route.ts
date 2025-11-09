import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth-handler';
import { volunteerService } from '@/lib/services/volunteer.service';
import { serializeEvent } from '@/lib/utils/serialization';

/**
 * GET /api/volunteers/me/invitations
 * Get all pending invitations for the current volunteer
 */
export const GET = withAuth(async (user) => {
  const invitations = await volunteerService.getPendingInvitations(user);

  return NextResponse.json({
    invitationCount: invitations.length,
    invitations: invitations.map(inv => ({
      id: inv.id,
      matchId: inv.id,
      score: inv.score,
      emailSentAt: inv.emailSentAt,
      matchedAt: inv.matchedAt,
      event: serializeEvent(inv.event),
    })),
  }, { status: 200 });
});
