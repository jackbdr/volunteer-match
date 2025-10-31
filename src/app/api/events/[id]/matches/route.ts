import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { MatchingService } from '@/lib/services/matching';
import { UserRole } from '@prisma/client';

/**
 * POST /api/events/[id]/matches
 * Calculate and store matches for a specific event
 * Admin only
 */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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
    if (error instanceof Error) {
      if (error.message === 'Event not found') {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        );
      }
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    console.error('Failed to calculate matches:', error);
    return NextResponse.json(
      { error: 'Failed to calculate matches' },
      { status: 500 }
    );
  }
}