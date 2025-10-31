import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { MatchingService } from '@/lib/services/matching';
import { UserRole } from '@prisma/client';
import { handleApiError } from '@/lib/api-utils';

/**
 * POST /api/events/[id]/matches
 * Calculate and store matches for a specific event
 * Admin only
 */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const params = await context.params;

    await requireAuth(UserRole.ADMIN);

    const matchingService = new MatchingService();
    const matches = await matchingService.findMatchesForEvent(params.id);

    return NextResponse.json({
      success: true,
      eventId: params.id,
      matchCount: matches.length,
      topMatches: matches.slice(0, 5),
    });
  } catch (error) {
    return handleApiError(error, 'Failed to calculate matches');
  }
}