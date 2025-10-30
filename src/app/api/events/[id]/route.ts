import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth';
import { updateEventSchema } from '@/lib/validations/event';
import { UserRole } from '@prisma/client';
import { handleApiError } from '@/lib/api-utils';

/**
 * GET /api/events/[id]
 * Get a single event with its matches
 * Public access
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        matches: {
          include: {
            volunteer: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { score: 'desc' },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch event');
  }
}

/**
 * PATCH /api/events/[id]
 * Update an event
 * Admin only
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(UserRole.ADMIN);

    const body = await request.json();
    const validated = updateEventSchema.parse(body);

    const data = {
      ...validated,
      ...(validated.startTime && { startTime: new Date(validated.startTime) }),
    };

    const event = await prisma.event.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(event);
  } catch (error) {
    return handleApiError(error, 'Failed to update event');
  }
}

/**
 * DELETE /api/events/[id]
 * Delete an event
 * Admin only
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(UserRole.ADMIN);

    await prisma.event.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    return handleApiError(error, 'Failed to delete event');
  }
}
