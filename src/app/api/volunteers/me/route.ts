import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { updateVolunteerSchema } from '@/lib/validations/volunteer';
import { z } from 'zod';

/**
 * GET /api/volunteers/me
 * Get current user's volunteer profile
 * Authenticated volunteers only
 */
export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        matches: {
          include: {
            event: true,
          },
          orderBy: { score: 'desc' },
          take: 10, // Latest 10 matches
        },
      },
    });

    if (!volunteer) {
      return NextResponse.json(
        { error: 'Volunteer profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(volunteer);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/volunteers/me
 * Update current user's volunteer profile
 * Authenticated volunteers only
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = updateVolunteerSchema.parse(body);

    const volunteer = await prisma.volunteer.update({
      where: { userId: user.id },
      data: validated,
    });

    return NextResponse.json(volunteer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
