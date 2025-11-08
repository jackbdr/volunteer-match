import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth-handler';
import { zoomService } from '@/lib/services/zoom.service';
import { createZoomMeetingSchema } from '@/lib/validations/zoom';
import { UserRole } from '@prisma/client';

/**
 * POST /api/zoom/meetings
 * Create a new Zoom meeting using the default organization host
 * Admin only
 */
export const POST = withAuth(async (user, request: NextRequest) => {
  const data = await request.json();
  const validatedData = createZoomMeetingSchema.parse(data);

  const defaultHostId = process.env.ZOOM_DEFAULT_HOST_ID;
  if (!defaultHostId) {
    return NextResponse.json({
      error: 'ZOOM_DEFAULT_HOST_ID not configured'
    }, { status: 500 });
  }
  
  const meeting = await zoomService.createMeeting(defaultHostId, validatedData);

  return NextResponse.json(meeting, { status: 201 });
}, UserRole.ADMIN);