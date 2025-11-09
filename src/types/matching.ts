import { Event, Volunteer } from '@prisma/client';

/**
 * Event with calculated match score
 */
export interface EventMatch extends Event {
  matchScore: number;
}

/**
 * Volunteer with calculated match score
 */
export interface VolunteerMatch extends Volunteer {
  matchScore: number;
}

/**
 * Detailed breakdown of how a match score was calculated
 */
export interface MatchScoreBreakdown {
  skillsScore: number;
  availabilityScore: number;
  locationScore: number;
}

/**
 * Complete match score with breakdown
 */
export interface MatchScore {
  volunteerId: string;
  eventId: string;
  score: number;
  breakdown: MatchScoreBreakdown;
}

/**
 * Result of batch matching operations
 */
export interface MatchingResult {
  eventsProcessed: number;
  matchesCreated: number;
}