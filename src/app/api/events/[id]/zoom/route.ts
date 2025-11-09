import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth-handler';
import { eventService } from '@/lib/services/event.service';
import { serializeEvent } from '@/lib/utils/serialization';
import { UserRole } from '@prisma/client';

/**
 * POST /api/events/[id]/zoom
 * Create a Zoom meeting for a virtual event
 * Admin only
 */
export const POST = withAuth(async (user, request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const params = await context.params;
  const event = await eventService.createZoomMeetingForEvent(params.id, user);

  return NextResponse.json(serializeEvent(event), { status: 201 });
}, UserRole.ADMIN);
