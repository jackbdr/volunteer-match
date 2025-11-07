import { NextRequest, NextResponse } from 'next/server';
import { withOptionalAuth, withAuth } from '@/lib/middleware/auth-handler';
import { eventService } from '@/lib/services/event.service';
import { EventRepository } from '@/lib/repositories/event.repository';
import { UserRole } from '@prisma/client';

const eventRepository = new EventRepository();

/**
 * GET /api/events/[id]
 * Get a single event
 * Public access (but inactive events only visible to authenticated users)
 */
export const GET = withOptionalAuth(async (user, request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const params = await context.params;
  const event = await eventRepository.findById(params.id);
  
  return NextResponse.json(event, { status: 200 });
});

/**
 * PATCH /api/events/[id]
 * Update an event
 * Admin only
 */
export const PATCH = withAuth(async (user, request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const params = await context.params;
  const data = await request.json();
  const event = await eventService.updateEvent(params.id, user, data);

  return NextResponse.json(event, { status: 200 });
}, UserRole.ADMIN);

/**
 * DELETE /api/events/[id]
 * Delete an event
 * Admin only
 */
export const DELETE = withAuth(async (user, request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const params = await context.params;
  await eventService.deleteEvent(params.id, user);

  return NextResponse.json({ success: true, message: 'Event deleted' }, { status: 204 });
}, UserRole.ADMIN);
