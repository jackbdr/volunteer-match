import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth-handler';
import { matchingService } from '@/lib/services/matching.service';
import { UserRole } from '@prisma/client';

/**
 * GET /api/matches
 * Get all event-volunteer matches
 * Admin only
 */
export const GET = withAuth(async (user) => {
  const matches = await matchingService.getAllMatches(user);
  return NextResponse.json(matches, { status: 200 });
}, UserRole.ADMIN);
