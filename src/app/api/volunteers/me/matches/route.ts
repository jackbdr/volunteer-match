import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth-handler';
import { volunteerService } from '@/lib/services/volunteer.service';

/**
 * GET /api/volunteers/me/matches
 * Get all registered events (ACCEPTED matches) for the current volunteer
 */
export const GET = withAuth(async (user) => {
  const matches = await volunteerService.getAcceptedMatches(user);

  const serializedMatches = matches.map(match => ({
    id: match.id,
    score: match.score,
    status: match.status,
    matchedAt: match.matchedAt,
    event: {
      id: match.event.id,
      title: match.event.title,
      startTime: match.event.startTime,
      eventType: match.event.eventType,
      location: match.event.location,
      meetingUrl: match.event.meetingUrl,
      duration: match.event.duration,
      status: match.event.status,
    },
  }));

  return NextResponse.json({ 
    matches: serializedMatches 
  }, { status: 200 });
});
