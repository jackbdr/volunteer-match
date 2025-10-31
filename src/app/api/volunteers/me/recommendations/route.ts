import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { MatchingService } from '@/lib/services/matching';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/volunteers/me/recommendations
 * Get recommended events for current volunteer
 * Authenticated volunteers only
 */
export async function GET() {
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
    });

    if (!volunteer) {
      return NextResponse.json(
        { error: 'Volunteer profile not found' },
        { status: 404 }
      );
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
    console.error('Failed to get recommendations:', error);
    
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}