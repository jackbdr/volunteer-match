import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth-handler';
import { zoomService } from '@/lib/services/zoom.service';
import { updateZoomMeetingSchema } from '@/lib/validations/zoom';
import { UserRole } from '@prisma/client';

/**
 * GET /api/zoom/meetings/[id]
 * Get Zoom meeting details
 * Admin only
 */
export const GET = withAuth(async (user, request: NextRequest, context: { params: Promise<{ id: bigint }> }) => {
  const params = await context.params;
  const meeting = await zoomService.getMeeting(params.id);

  return NextResponse.json(meeting, { status: 200 });
}, UserRole.ADMIN);

/**
 * PATCH /api/zoom/meetings/[id]
 * Update Zoom meeting
 * Admin only
 */
export const PATCH = withAuth(async (user, request: NextRequest, context: { params: Promise<{ id: bigint }> }) => {
  const params = await context.params;
  const data = await request.json();
  const validatedData = updateZoomMeetingSchema.parse(data);

  const meeting = await zoomService.updateMeeting(params.id, validatedData);

  return NextResponse.json(meeting, { status: 200 });
}, UserRole.ADMIN);

/**
 * DELETE /api/zoom/meetings/[id]
 * Delete Zoom meeting
 * Admin only
 */
export const DELETE = withAuth(async (user, request: NextRequest, context: { params: Promise<{ id: bigint }> }) => {
  const params = await context.params;
  
  await zoomService.deleteMeeting(params.id);

  return NextResponse.json({ success: true, message: 'Meeting deleted successfully' }, { status: 204 });
}, UserRole.ADMIN);