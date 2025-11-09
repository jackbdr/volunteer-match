import { NextRequest, NextResponse } from 'next/server';
import { withOptionalAuth, withAuth } from '@/lib/middleware/auth-handler';
import { eventService } from '@/lib/services/event.service';
import { EventRepository } from '@/lib/repositories/event.repository';
import { parseEventFilters } from '@/lib/utils/query-params';
import { serializeEvents, serializeEvent } from '@/lib/utils/serialization';
import { createEventSchema } from '@/lib/validations/event';
import { UserRole } from '@prisma/client';

const eventRepository = new EventRepository();

/**
 * GET /api/events
 * List all events with optional filtering
 * Public access (but authenticated users see inactive events too)
 */
export const GET = withOptionalAuth(async (user, request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const filters = parseEventFilters(searchParams);
  const events = await eventRepository.findAll(filters);

  return NextResponse.json(serializeEvents(events), { status: 200 });
});

/**
 * POST /api/events
 * Create a new event
 * Admin only
 */
export const POST = withAuth(async (user, request: NextRequest) => {
  const body = await request.json();
  const validatedData = createEventSchema.parse(body);
  const event = await eventService.createEvent(user, validatedData);
  
  return NextResponse.json(serializeEvent(event), { status: 201 });
}, UserRole.ADMIN);
