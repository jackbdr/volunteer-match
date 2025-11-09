import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth-handler';
import { volunteerService } from '@/lib/services/volunteer.service';

/**
 * POST /api/volunteers/me/invitations/[matchId]/respond?action=accept|decline
 * Respond to an event invitation
 */
export const POST = withAuth(async (user, request: NextRequest, { params }: { params: Promise<{ matchId: string }> }) => {
  const { matchId } = await params;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (!action || !['accept', 'decline'].includes(action)) {
    return NextResponse.json(
      { error: 'Invalid action. Must be accept or decline.' },
      { status: 400 }
    );
  }

  await volunteerService.respondToInvitation(
    user,
    matchId,
    action as 'accept' | 'decline'
  );

  return NextResponse.json(
    { 
      message: action === 'accept' 
        ? 'Successfully registered for event' 
        : 'Invitation declined' 
    },
    { status: 200 }
  );
});
