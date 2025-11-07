import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth-handler';
import { matchingService } from '@/lib/services/matching.service';
import { volunteerService } from '@/lib/services/volunteer.service';

/**
 * GET /api/volunteers/me/recommendations
 * Get recommended events for current volunteer
 * Authenticated volunteers only
 */
export const GET = withAuth(async (user) => {
  const volunteer = await volunteerService.getCurrentUserProfile(user);
  const recommendations = await matchingService.getRecommendedEvents(volunteer.id, user);

  return NextResponse.json({
    volunteerId: volunteer.id,
    recommendationCount: recommendations.length,
    recommendations,
  }, { status: 200 });
});