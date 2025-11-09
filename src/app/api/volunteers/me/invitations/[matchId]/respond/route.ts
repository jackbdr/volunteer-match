import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth-handler';
import { volunteerService } from '@/lib/services/volunteer.service';
import { respondToInvitationSchema } from '@/lib/validations/match';
import { InvitationAction } from '@/types/invitation';

/**
 * POST /api/volunteers/me/invitations/[matchId]/respond
 * Respond to an event invitation
 */
export const POST = withAuth(async (user, request: NextRequest, { params }: { params: Promise<{ matchId: string }> }) => {
  const { matchId } = await params;
  const body = await request.json();
  
  const validatedData = respondToInvitationSchema.parse(body);

  await volunteerService.respondToInvitation(
    user,
    matchId,
    validatedData.action
  );

  return NextResponse.json(
    { 
      message: validatedData.action === InvitationAction.ACCEPT 
        ? 'Successfully registered for event' 
        : 'Invitation declined' 
    },
    { status: 200 }
  );
});
