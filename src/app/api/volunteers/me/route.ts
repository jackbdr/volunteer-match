import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { updateVolunteerSchema } from '@/lib/validations/volunteer';
import { handleApiError } from '@/lib/api-utils';
import { UnauthorizedError, NotFoundError } from '@/lib/errors';

/**
 * GET /api/volunteers/me
 * Get current user's volunteer profile
 * Authenticated volunteers only
 */
export async function GET(): Promise<NextResponse> {
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
          take: 10,
        },
      },
    });

    if (!volunteer) {
      throw new NotFoundError('Volunteer profile not found');
    }

    return NextResponse.json(volunteer);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch profile');
  }
}

/**
 * PATCH /api/volunteers/me
 * Update current user's volunteer profile
 * Authenticated volunteers only
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new UnauthorizedError();
    }

    const body = await request.json();
    const validated = updateVolunteerSchema.parse(body);

    const volunteer = await prisma.volunteer.update({
      where: { userId: user.id },
      data: validated,
    });

    return NextResponse.json(volunteer);
  } catch (error) {
    return handleApiError(error, 'Failed to update profile');
  }
}
