import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth-handler';
import { eventService } from '@/lib/services/event.service';
import { UserRole } from '@prisma/client';
import { inviteSchema } from '@/lib/validations/match';

/**
 * POST /api/events/[id]/invite
 * Send invitation email to a specific matched volunteer
 * Admin only
 */
export const POST = withAuth(async (user, request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const params = await context.params;
  const eventId = params.id;
  
  const body = await request.json();
  const validatedData = inviteSchema.parse(body);

  await eventService.sendInvitation(eventId, validatedData.matchId, user);

  return NextResponse.json({
    success: true,
    message: 'Invitation sent successfully',
  }, { status: 200 });
}, UserRole.ADMIN);
