import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { MatchingService } from '@/lib/services/matching';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/api-utils';
import { UnauthorizedError, NotFoundError } from '@/lib/errors';

/**
 * GET /api/volunteers/me/recommendations
 * Get recommended events for current volunteer
 * Authenticated volunteers only
 */
export async function GET(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new UnauthorizedError();
    }

    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: user.id },
    });

    if (!volunteer) {
      throw new NotFoundError('Volunteer profile not found');
    }

    const matchingService = new MatchingService();
    const recommendations = await matchingService.getRecommendedEvents(
      volunteer.id
    );

    return NextResponse.json({
      volunteerId: volunteer.id,
      recommendationCount: recommendations.length,
      recommendations,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to get recommendations');
  }
}