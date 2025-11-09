import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { UserRole, MatchStatus } from '@prisma/client';
import { MatchingService } from '@/lib/services/matching.service';
import type { EventMatchRepository } from '@/lib/repositories/event-match.repository';
import type { EventRepository } from '@/lib/repositories/event.repository';
import type { VolunteerRepository } from '@/lib/repositories/volunteer.repository';
import { createMockEvent, createMockVolunteer, createMockEventMatch } from '../../test-utils';

// Mock dependencies
const mockEventMatchRepository = {
  findAll: jest.fn(),
  findByVolunteerId: jest.fn(),
  findByEventAndVolunteer: jest.fn(),
  findByEventId: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
};

const mockEventRepository = {
  findById: jest.fn(),
  findBySkills: jest.fn(),
};

const mockVolunteerRepository = {
  findById: jest.fn(),
  findBySkills: jest.fn(),
};

describe('MatchingService', () => {
  let matchingService: MatchingService;
  const adminUser = { id: 'admin-1', email: 'admin@example.com', role: UserRole.ADMIN };
  const volunteerUser = { id: 'volunteer-1', email: 'volunteer@example.com', role: UserRole.VOLUNTEER };

  beforeEach(() => {
    // Reset all mocks
    Object.values(mockEventMatchRepository).forEach((mock) => (mock as jest.Mock).mockReset());
    Object.values(mockEventRepository).forEach((mock) => (mock as jest.Mock).mockReset());
    Object.values(mockVolunteerRepository).forEach((mock) => (mock as jest.Mock).mockReset());

    // Create service with mocked dependencies
    matchingService = new MatchingService(
      mockEventMatchRepository as unknown as EventMatchRepository,
      mockEventRepository as unknown as EventRepository,
      mockVolunteerRepository as unknown as VolunteerRepository
    );
  });

  describe('getAllMatches', () => {
    it('should return all matches for admin user', async () => {
      const mockMatches = [createMockEventMatch()];
      mockEventMatchRepository.findAll.mockResolvedValue(mockMatches);

      const result = await matchingService.getAllMatches(adminUser);

      expect(mockEventMatchRepository.findAll).toHaveBeenCalled();
      expect(result).toBe(mockMatches);
    });

    it('should throw ForbiddenError for non-admin user', async () => {
      await expect(
        matchingService.getAllMatches(volunteerUser)
      ).rejects.toThrow('Only administrators can view all matches');

      expect(mockEventMatchRepository.findAll).not.toHaveBeenCalled();
    });
  });

  describe('getVolunteerMatches', () => {
    const volunteerId = 'volunteer-1';

    it('should return matches for admin user', async () => {
      const mockVolunteer = createMockVolunteer({ id: volunteerId });
      const mockMatches = [createMockEventMatch()];

      mockVolunteerRepository.findById.mockResolvedValue(mockVolunteer);
      mockEventMatchRepository.findByVolunteerId.mockResolvedValue(mockMatches);

      const result = await matchingService.getVolunteerMatches(volunteerId, adminUser);

      expect(mockEventMatchRepository.findByVolunteerId).toHaveBeenCalledWith(volunteerId);
      expect(result).toBe(mockMatches);
    });

    it('should return matches for volunteer owner', async () => {
      const mockVolunteer = createMockVolunteer({
        id: volunteerId,
        userId: volunteerUser.id,
      });
      const mockMatches = [createMockEventMatch()];

      mockVolunteerRepository.findById.mockResolvedValue(mockVolunteer);
      mockEventMatchRepository.findByVolunteerId.mockResolvedValue(mockMatches);

      const result = await matchingService.getVolunteerMatches(volunteerId, volunteerUser);

      expect(result).toBe(mockMatches);
    });

    it('should throw ForbiddenError for non-owner non-admin', async () => {
      const mockVolunteer = createMockVolunteer({
        id: volunteerId,
        userId: 'other-user',
      });

      mockVolunteerRepository.findById.mockResolvedValue(mockVolunteer);

      await expect(
        matchingService.getVolunteerMatches(volunteerId, volunteerUser)
      ).rejects.toThrow('You can only view your own matches');
    });
  });

  describe('createMatch', () => {
    const eventId = 'event-1';
    const volunteerId = 'volunteer-1';

    it('should create match successfully', async () => {
      const futureDate = new Date(Date.now() + 86400000);
      const mockEvent = createMockEvent({ 
        id: eventId, 
        startTime: futureDate 
      });
      const mockVolunteer = createMockVolunteer({ id: volunteerId });
      const mockMatch = createMockEventMatch();

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockVolunteerRepository.findById.mockResolvedValue(mockVolunteer);
      mockEventMatchRepository.findByEventAndVolunteer.mockResolvedValue(null);
      mockEventMatchRepository.create.mockResolvedValue(mockMatch);

      const result = await matchingService.createMatch(eventId, volunteerId, adminUser, {
        score: 85,
      });

      expect(mockEventMatchRepository.create).toHaveBeenCalledWith({
        eventId,
        volunteerId,
        status: MatchStatus.PENDING,
        score: 85,
        notified: false,
        emailSentAt: null,
      });
      expect(result).toBe(mockMatch);
    });

    it('should use default score of 0 when not provided', async () => {
      const futureDate = new Date(Date.now() + 86400000);
      const mockEvent = createMockEvent({ startTime: futureDate });
      const mockVolunteer = createMockVolunteer();

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockVolunteerRepository.findById.mockResolvedValue(mockVolunteer);
      mockEventMatchRepository.findByEventAndVolunteer.mockResolvedValue(null);
      mockEventMatchRepository.create.mockResolvedValue(createMockEventMatch());

      await matchingService.createMatch(eventId, volunteerId, adminUser);

      expect(mockEventMatchRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ score: 0 })
      );
    });

    it('should throw ValidationError if match already exists', async () => {
      const mockEvent = createMockEvent();
      const mockVolunteer = createMockVolunteer();
      const existingMatch = createMockEventMatch();

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockVolunteerRepository.findById.mockResolvedValue(mockVolunteer);
      mockEventMatchRepository.findByEventAndVolunteer.mockResolvedValue(existingMatch);

      await expect(
        matchingService.createMatch(eventId, volunteerId, adminUser)
      ).rejects.toThrow('Match between this volunteer and event already exists');

      expect(mockEventMatchRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for past event', async () => {
      const pastDate = new Date(Date.now() - 86400000);
      const mockEvent = createMockEvent({ startTime: pastDate });
      const mockVolunteer = createMockVolunteer();

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockVolunteerRepository.findById.mockResolvedValue(mockVolunteer);
      mockEventMatchRepository.findByEventAndVolunteer.mockResolvedValue(null);

      await expect(
        matchingService.createMatch(eventId, volunteerId, adminUser)
      ).rejects.toThrow('Cannot create match for past event');
    });
  });

  describe('calculateMatchScore', () => {
    it('should calculate perfect match score', () => {
      const matchingService = new MatchingService();
      // Access private method through unknown casting for testing
      const calculateScore = (matchingService as unknown as { calculateMatchScore: (v: string[], e: string[]) => number }).calculateMatchScore;
      
      const volunteerSkills = ['JavaScript', 'React', 'Node.js'];
      const eventSkills = ['JavaScript', 'React', 'Node.js'];

      const score = calculateScore(volunteerSkills, eventSkills);
      expect(score).toBe(100);
    });

    it('should calculate partial match score', () => {
      const matchingService = new MatchingService();
      const calculateScore = (matchingService as unknown as { calculateMatchScore: (v: string[], e: string[]) => number }).calculateMatchScore;
      
      const volunteerSkills = ['JavaScript', 'React', 'Python'];
      const eventSkills = ['JavaScript', 'React']; // 2 out of 2 match

      const score = calculateScore(volunteerSkills, eventSkills);
      expect(score).toBe(100); // 2/2 = 100%
    });

    it('should handle case insensitive matching', () => {
      const matchingService = new MatchingService();
      const calculateScore = (matchingService as unknown as { calculateMatchScore: (v: string[], e: string[]) => number }).calculateMatchScore;
      
      const volunteerSkills = ['javascript', 'REACT'];
      const eventSkills = ['JavaScript', 'React'];

      const score = calculateScore(volunteerSkills, eventSkills);
      expect(score).toBe(100);
    });

    it('should return 0 for no matching skills', () => {
      const matchingService = new MatchingService();
      const calculateScore = (matchingService as unknown as { calculateMatchScore: (v: string[], e: string[]) => number }).calculateMatchScore;
      
      const volunteerSkills = ['Python', 'Django'];
      const eventSkills = ['JavaScript', 'React'];

      const score = calculateScore(volunteerSkills, eventSkills);
      expect(score).toBe(0);
    });

    it('should return 0 for empty skills arrays', () => {
      const matchingService = new MatchingService();
      const calculateScore = (matchingService as unknown as { calculateMatchScore: (v: string[], e: string[]) => number }).calculateMatchScore;
      
      expect(calculateScore([], ['JavaScript'])).toBe(0);
      expect(calculateScore(['JavaScript'], [])).toBe(0);
      expect(calculateScore([], [])).toBe(0);
    });
  });

  describe('getRecommendedEvents', () => {
    const volunteerId = 'volunteer-1';

    it('should return recommended events for volunteer owner', async () => {
      const mockVolunteer = createMockVolunteer({
        id: volunteerId,
        userId: volunteerUser.id,
        skills: ['JavaScript', 'React'],
      });

      const mockEvents = [
        createMockEvent({ requiredSkills: ['JavaScript', 'React'] }),
        createMockEvent({ requiredSkills: ['JavaScript'] }),
      ];

      mockVolunteerRepository.findById.mockResolvedValue(mockVolunteer);
      mockEventRepository.findBySkills.mockResolvedValue(mockEvents);

      const result = await matchingService.getRecommendedEvents(volunteerId, volunteerUser);

      expect(mockEventRepository.findBySkills).toHaveBeenCalledWith(mockVolunteer.skills);
      expect(result).toHaveLength(2);
      expect(result[0].matchScore).toBeGreaterThanOrEqual(result[1].matchScore); // Sorted by score
    });

    it('should return recommended events for admin', async () => {
      const mockVolunteer = createMockVolunteer({
        id: volunteerId,
        skills: ['JavaScript'],
      });

      const mockEvents = [createMockEvent({ requiredSkills: ['JavaScript'] })];

      mockVolunteerRepository.findById.mockResolvedValue(mockVolunteer);
      mockEventRepository.findBySkills.mockResolvedValue(mockEvents);

      const result = await matchingService.getRecommendedEvents(volunteerId, adminUser);

      expect(result).toHaveLength(1);
    });

    it('should throw ForbiddenError for non-owner non-admin', async () => {
      const mockVolunteer = createMockVolunteer({
        id: volunteerId,
        userId: 'other-user',
      });

      mockVolunteerRepository.findById.mockResolvedValue(mockVolunteer);

      await expect(
        matchingService.getRecommendedEvents(volunteerId, volunteerUser)
      ).rejects.toThrow('You can only get recommendations for yourself');
    });
  });

  describe('getRecommendedVolunteers', () => {
    const eventId = 'event-1';

    it('should return recommended volunteers for event', async () => {
      const mockEvent = createMockEvent({
        id: eventId,
        requiredSkills: ['JavaScript', 'React'],
      });

      const mockVolunteers = [
        createMockVolunteer({ skills: ['JavaScript', 'React', 'Node.js'] }),
        createMockVolunteer({ skills: ['JavaScript'] }),
      ];

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockVolunteerRepository.findBySkills.mockResolvedValue(mockVolunteers);

      const result = await matchingService.getRecommendedVolunteers(eventId, adminUser);

      expect(mockVolunteerRepository.findBySkills).toHaveBeenCalledWith(mockEvent.requiredSkills);
      expect(result).toHaveLength(2);
      expect(result[0].matchScore).toBeGreaterThan(result[1].matchScore);
      expect(result[0].status).toBe('PENDING');
    });

    it('should filter out volunteers with no matching skills', async () => {
      const mockEvent = createMockEvent({
        requiredSkills: ['JavaScript'],
      });

      const mockVolunteers = [
        createMockVolunteer({ skills: ['Python'] }), // No match
      ];

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockVolunteerRepository.findBySkills.mockResolvedValue(mockVolunteers);

      const result = await matchingService.getRecommendedVolunteers(eventId, adminUser);

      expect(result).toHaveLength(0);
    });
  });

  describe('calculateAndSaveMatches', () => {
    const eventId = 'event-1';

    it('should calculate and save new matches', async () => {
      const mockEvent = createMockEvent({
        id: eventId,
        requiredSkills: ['JavaScript', 'React'],
      });

      const mockVolunteers = [
        createMockVolunteer({ id: 'vol-1', skills: ['JavaScript', 'React'] }),
        createMockVolunteer({ id: 'vol-2', skills: ['JavaScript'] }),
        createMockVolunteer({ id: 'vol-3', skills: ['Python'] }), // No match
      ];

      const existingMatches = [
        createMockEventMatch({ volunteerId: 'vol-1' }), // Already exists
      ];

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockVolunteerRepository.findBySkills.mockResolvedValue(mockVolunteers);
      mockEventMatchRepository.findByEventId.mockResolvedValue(existingMatches);
      mockEventMatchRepository.createMany.mockResolvedValue(undefined);

      const result = await matchingService.calculateAndSaveMatches(eventId, adminUser);

      // Should create match for vol-2 only (vol-1 exists, vol-3 has no matching skills)
      expect(mockEventMatchRepository.createMany).toHaveBeenCalledWith([
        {
          eventId,
          volunteerId: 'vol-2',
          status: MatchStatus.PENDING,
          score: 50, // 1 out of 2 skills match
          notified: false,
          emailSentAt: null,
        },
      ]);

      expect(result).toEqual({
        matchesFound: 3,
        matchesCreated: 1,
      });
    });

    it('should handle case when no new matches are created', async () => {
      const mockEvent = createMockEvent({
        requiredSkills: ['JavaScript'],
      });

      const mockVolunteers = [
        createMockVolunteer({ id: 'vol-1', skills: ['JavaScript'] }),
      ];

      const existingMatches = [
        createMockEventMatch({ volunteerId: 'vol-1' }), // Already exists
      ];

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockVolunteerRepository.findBySkills.mockResolvedValue(mockVolunteers);
      mockEventMatchRepository.findByEventId.mockResolvedValue(existingMatches);

      const result = await matchingService.calculateAndSaveMatches(eventId, adminUser);

      expect(mockEventMatchRepository.createMany).not.toHaveBeenCalled();
      expect(result).toEqual({
        matchesFound: 1,
        matchesCreated: 0,
      });
    });

    it('should not create matches for volunteers with no matching skills', async () => {
      const mockEvent = createMockEvent({
        requiredSkills: ['JavaScript'],
      });

      const mockVolunteers = [
        createMockVolunteer({ id: 'vol-1', skills: ['Python'] }),
        createMockVolunteer({ id: 'vol-2', skills: ['Ruby'] }),
      ];

      mockEventRepository.findById.mockResolvedValue(mockEvent);
      mockVolunteerRepository.findBySkills.mockResolvedValue(mockVolunteers);
      mockEventMatchRepository.findByEventId.mockResolvedValue([]);

      const result = await matchingService.calculateAndSaveMatches(eventId, adminUser);

      expect(mockEventMatchRepository.createMany).not.toHaveBeenCalled();
      expect(result).toEqual({
        matchesFound: 2,
        matchesCreated: 0,
      });
    });
  });
});