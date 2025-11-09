import { EventMatch, MatchStatus } from '@prisma/client';
import { EventMatchRepository, CreateEventMatchData, EventMatchWithRelations } from '@/lib/repositories/event-match.repository';
import { EventRepository } from '@/lib/repositories/event.repository';
import { VolunteerRepository } from '@/lib/repositories/volunteer.repository';
import { ValidationError, ForbiddenError, NotFoundError } from '@/lib/errors';
import type { AuthUser } from '@/lib/types/auth';

export class MatchingService {
  private eventMatchRepository: EventMatchRepository;
  private eventRepository: EventRepository;
  private volunteerRepository: VolunteerRepository;

  public constructor(
    eventMatchRepository: EventMatchRepository = new EventMatchRepository(),
    eventRepository: EventRepository = new EventRepository(),
    volunteerRepository: VolunteerRepository = new VolunteerRepository()
  ) {
    this.eventMatchRepository = eventMatchRepository;
    this.eventRepository = eventRepository;
    this.volunteerRepository = volunteerRepository;
  }

  /**
   * Get all matches (admin only)
   */
  public async getAllMatches(user: AuthUser): Promise<EventMatchWithRelations[]> {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenError('Only administrators can view all matches');
    }

    return this.eventMatchRepository.findAll();
  }

  /**
   * Get all matches for a volunteer
   */
  public async getVolunteerMatches(volunteerId: string, user: AuthUser): Promise<EventMatchWithRelations[]> {
    const volunteer = await this.volunteerRepository.findById(volunteerId);

    if (user.role !== 'ADMIN' && volunteer.userId !== user.id) {
      throw new ForbiddenError('You can only view your own matches');
    }

    return this.eventMatchRepository.findByVolunteerId(volunteerId);
  }

  /**
   * Create a new match between volunteer and event
   */
  public async createMatch(
    eventId: string,
    volunteerId: string,
    user: AuthUser,
    matchData?: {
      score?: number;
    }
  ): Promise<EventMatch> {
    const event = await this.eventRepository.findById(eventId);
    const _volunteer = await this.volunteerRepository.findById(volunteerId);

    const existingMatch = await this.eventMatchRepository.findByEventAndVolunteer(eventId, volunteerId);
    if (existingMatch) {
      throw new ValidationError('Match between this volunteer and event already exists');
    }

    if (event.startTime <= new Date()) {
      throw new ValidationError('Cannot create match for past event');
    }

    const createData: CreateEventMatchData = {
      eventId,
      volunteerId,
      status: MatchStatus.PENDING,
      score: matchData?.score || 0,
      notified: false,
    };

    return this.eventMatchRepository.create(createData);
  }


  /**
   * Calculate match score between volunteer and event
   */
  private calculateMatchScore(volunteerSkills: string[], eventSkills: string[]): number {
    if (!volunteerSkills.length || !eventSkills.length) {
      return 0;
    }

    const normalizedVolunteerSkills = volunteerSkills.map(s => s.toLowerCase());
    const normalizedEventSkills = eventSkills.map(s => s.toLowerCase());

    const matchingSkills = normalizedVolunteerSkills.filter(skill => 
      normalizedEventSkills.includes(skill)
    );

    return Math.round((matchingSkills.length / normalizedEventSkills.length) * 100);
  }

  /**
   * Get recommended events for a volunteer
   */
  public async getRecommendedEvents(volunteerId: string, user: AuthUser): Promise<unknown[]> {
    const volunteer = await this.volunteerRepository.findById(volunteerId);

    if (user.role !== 'ADMIN' && volunteer.userId !== user.id) {
      throw new ForbiddenError('You can only get recommendations for yourself');
    }

    const events = await this.eventRepository.findBySkills(volunteer.skills);

    return events.map(event => ({
      event,
      matchScore: this.calculateMatchScore(volunteer.skills, event.requiredSkills),
    })).filter(rec => rec.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Get recommended volunteers for an event
   */
  public async getRecommendedVolunteers(eventId: string, _user: AuthUser): Promise<unknown[]> {
    const event = await this.eventRepository.findById(eventId);
    
    const volunteers = await this.volunteerRepository.findBySkills(event.requiredSkills);

    return volunteers.map(volunteer => ({
      volunteer,
      matchScore: this.calculateMatchScore(volunteer.skills, event.requiredSkills),
      score: this.calculateMatchScore(volunteer.skills, event.requiredSkills),
      status: 'PENDING',
    })).filter(rec => rec.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Calculate matches and save them to the database
   * Returns both existing and newly created matches
   */
  public async calculateAndSaveMatches(eventId: string, user: AuthUser): Promise<{ matchesFound: number; matchesCreated: number }> {
    const event = await this.eventRepository.findById(eventId);
    
    const volunteers = await this.volunteerRepository.findBySkills(event.requiredSkills);

    let matchesCreated = 0;
    
    for (const volunteer of volunteers) {
      const score = this.calculateMatchScore(volunteer.skills, event.requiredSkills);
      
      if (score > 0) {
        const existingMatch = await this.eventMatchRepository.findByEventAndVolunteer(eventId, volunteer.id);
        
        if (!existingMatch) {
          await this.createMatch(eventId, volunteer.id, user, { score });
          matchesCreated++;
        }
      }
    }

    return {
      matchesFound: volunteers.length,
      matchesCreated,
    };
  }

  /**
   * Respond to a match invitation (accept or decline)
   */
  public async respondToMatch(user: AuthUser, matchId: string, action: 'accept' | 'decline'): Promise<EventMatch> {
    const match = await this.eventMatchRepository.findById(matchId);
    if (!match) {
      throw new NotFoundError('Match not found');
    }

    const volunteer = await this.volunteerRepository.findById(match.volunteerId);
    if (volunteer.userId !== user.id) {
      throw new ForbiddenError('You can only respond to your own invitations');
    }

    const newStatus = action === 'accept' ? MatchStatus.ACCEPTED : MatchStatus.DECLINED;
    return this.eventMatchRepository.update(matchId, { status: newStatus });
  }

}

export const matchingService = new MatchingService();