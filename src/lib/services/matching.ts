import { prisma } from '@/lib/db/prisma';
import { Event, Volunteer, EventType } from '@prisma/client';

export interface MatchScore {
  volunteerId: string;
  eventId: string;
  score: number;
  breakdown: {
    skillsScore: number;
    availabilityScore: number;
    locationScore: number;
  };
}

export class MatchingService {
  /**
   * Calculate match score between a volunteer and an event
   * 
   * Scoring breakdown:
   * - Skills: 40 points max (weighted by match percentage)
   * - Availability: 30 points max (binary: matches or doesn't)
   * - Location: 30 points max (virtual events always match, physical must match location)
   * 
   * Total: 0-100 points
   */
  calculateMatchScore(volunteer: Volunteer, event: Event): MatchScore {
    let totalScore = 0;
    const breakdown = {
      skillsScore: 0,
      availabilityScore: 0,
      locationScore: 0,
    };

    // 1. Skills Match (40 points max)
    if (event.requiredSkills.length > 0) {
      const matchingSkills = volunteer.skills.filter((skill) =>
        event.requiredSkills.includes(skill)
      );
      const skillMatchRatio = matchingSkills.length / event.requiredSkills.length;
      breakdown.skillsScore = Math.round(skillMatchRatio * 40);
      totalScore += breakdown.skillsScore;
    }

    // 2. Availability Match (30 points max)
    if (volunteer.availability.includes(event.timeSlot)) {
      breakdown.availabilityScore = 30;
      totalScore += 30;
    }

    // 3. Location Match (30 points max)
    if (event.eventType === EventType.VIRTUAL) {
      breakdown.locationScore = 30;
      totalScore += 30;
    } else if (
      volunteer.location.toLowerCase().trim() === 
      event.location.toLowerCase().trim()
    ) {
      breakdown.locationScore = 30;
      totalScore += 30;
    }

    return {
      volunteerId: volunteer.id,
      eventId: event.id,
      score: totalScore,
      breakdown,
    };
  }

  /**
   * Find and store matches for a specific event
   * 
   * @param eventId - The event to find matches for
   * @returns Array of match scores (sorted by score descending)
   */
  async findMatchesForEvent(eventId: string): Promise<MatchScore[]> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const volunteers = await prisma.volunteer.findMany();

    const scores = volunteers.map((volunteer) =>
      this.calculateMatchScore(volunteer, event)
    );

    // Filter out low scores (below 30% match = not viable)
    const viableMatches = scores.filter((score) => score.score >= 30);

    viableMatches.sort((a, b) => b.score - a.score);

    await this.storeMatches(viableMatches);

    return viableMatches;
  }

  /**
   * Store or update match scores in database
   */
  private async storeMatches(matches: MatchScore[]): Promise<void> {
    const upsertPromises = matches.map((match) =>
      prisma.eventMatch.upsert({
        where: {
          eventId_volunteerId: {
            eventId: match.eventId,
            volunteerId: match.volunteerId,
          },
        },
        update: {
          score: match.score,
        },
        create: {
          eventId: match.eventId,
          volunteerId: match.volunteerId,
          score: match.score,
        },
      })
    );

    await Promise.all(upsertPromises);
  }

  /**
   * Get recommended events for a volunteer
   * Returns events with match score >= 50
   */
  async getRecommendedEvents(volunteerId: string): Promise<Array<Event & { matchScore: number }>> {
    const matches = await prisma.eventMatch.findMany({
      where: {
        volunteerId,
        score: { gte: 50 },
      },
      include: {
        event: true,
      },
      orderBy: {
        score: 'desc',
      },
      take: 10,
    });

    return matches.map((match) => ({
      ...match.event,
      matchScore: match.score,
    }));
  }

  /**
   * Get top volunteer matches for an event
   * Returns volunteers with match score >= 50
   */
  async getTopVolunteersForEvent(eventId: string): Promise<Array<Volunteer & { matchScore: number }>> {
    const matches = await prisma.eventMatch.findMany({
      where: {
        eventId,
        score: { gte: 50 },
      },
      include: {
        volunteer: true,
      },
      orderBy: {
        score: 'desc',
      },
      take: 10,
    });

    return matches.map((match) => ({
      ...match.volunteer,
      matchScore: match.score,
    }));
  }

  /**
   * Recalculate all matches for all upcoming events
   * Useful for batch processing or cron jobs
   */
  async recalculateAllMatches(): Promise<{ eventsProcessed: number; matchesCreated: number }> {
    const upcomingEvents = await prisma.event.findMany({
      where: {
        startTime: {
          gte: new Date(),
        },
      },
    });

    let totalMatches = 0;

    for (const event of upcomingEvents) {
      const matches = await this.findMatchesForEvent(event.id);
      totalMatches += matches.length;
    }

    return {
      eventsProcessed: upcomingEvents.length,
      matchesCreated: totalMatches,
    };
  }
}