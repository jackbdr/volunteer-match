import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth';
import { createEventSchema } from '@/lib/validations/event';
import { UserRole } from '@prisma/client';
import { handleApiError } from '@/lib/api-utils';

/**
 * GET /api/events
 * List all events
 * Public access
 */
export async function GET(_request: NextRequest) {
  try {
    const events = await prisma.event.findMany({
      orderBy: { startTime: 'asc' },
      include: {
        _count: {
          select: { matches: true },
        },
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch events');
  }
}

/**
 * POST /api/events
 * Create a new event
 * Admin only
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth(UserRole.ADMIN);

    const body = await request.json();
    
    const validated = createEventSchema.parse(body);

    const event = await prisma.event.create({
      data: {
        ...validated,
        startTime: new Date(validated.startTime),
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Failed to create event');
  }
}
