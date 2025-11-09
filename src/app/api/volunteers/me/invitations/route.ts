import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth-handler';
import { volunteerService } from '@/lib/services/volunteer.service';
import { serializeInvitations } from '@/lib/utils/serialization';

/**
 * GET /api/volunteers/me/invitations
 * Get all pending invitations for the current volunteer
 */
export const GET = withAuth(async (user) => {
  const invitations = await volunteerService.getPendingInvitations(user);
  const serializedInvitations = serializeInvitations(invitations);

  return NextResponse.json({
    invitationCount: serializedInvitations.length,
    invitations: serializedInvitations,
  }, { status: 200 });
});
