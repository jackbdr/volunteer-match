import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth';
import { createEventSchema } from '@/lib/validations/event';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

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
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
