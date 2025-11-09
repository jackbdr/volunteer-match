import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth-handler';
import { matchingService } from '@/lib/services/matching.service';
import { EventMatchRepository } from '@/lib/repositories/event-match.repository';
import { UserRole } from '@prisma/client';

const eventMatchRepository = new EventMatchRepository();

/**
 * GET /api/events/[id]/matches
 * Get all matches for a specific event
 * Admin only
 */
export const GET = withAuth(async (user, request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const params = await context.params;
  const matches = await eventMatchRepository.findByEventId(params.id);
  
  return NextResponse.json(matches, { status: 200 });
}, UserRole.ADMIN);

/**
 * POST /api/events/[id]/matches
 * Calculate matches and save them to the database
 * Admin only
 */
export const POST = withAuth(async (user, request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const params = await context.params;
  const result = await matchingService.calculateAndSaveMatches(params.id, user);

  return NextResponse.json({
    success: true,
    eventId: params.id,
    matchesCreated: result.matchesCreated,
    matchesFound: result.matchesFound,
  }, { status: 200 });
}, UserRole.ADMIN);