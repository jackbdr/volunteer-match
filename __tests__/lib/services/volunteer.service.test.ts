import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { UserRole, MatchStatus, EventStatus } from '@prisma/client';
import { VolunteerService } from '@/lib/services/volunteer.service';
import type { VolunteerRepository } from '@/lib/repositories/volunteer.repository';
import type { EventMatchRepository } from '@/lib/repositories/event-match.repository';
import { InvitationAction } from '@/types/invitation';
import { createMockVolunteer, createMockEventMatch } from '../../test-utils';

// Mock dependencies
const mockVolunteerRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateByUserId: jest.fn(),
  delete: jest.fn(),
};

const mockEventMatchRepository = {
  findByVolunteerIdAndStatus: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
};

describe('VolunteerService', () => {
  let volunteerService: VolunteerService;
  const adminUser = { id: 'admin-1', email: 'admin@example.com', role: UserRole.ADMIN };
  const volunteerUser = { id: 'volunteer-1', email: 'volunteer@example.com', role: UserRole.VOLUNTEER };

  beforeEach(() => {
    // Reset all mocks
    Object.values(mockVolunteerRepository).forEach((mock) => (mock as jest.Mock).mockReset());
    Object.values(mockEventMatchRepository).forEach((mock) => (mock as jest.Mock).mockReset());

    // Create service with mocked dependencies
    volunteerService = new VolunteerService(
      mockVolunteerRepository as unknown as VolunteerRepository,
      mockEventMatchRepository as unknown as EventMatchRepository
    );
  });

  describe('getAllVolunteers', () => {
    it('should return all volunteers for admin user', async () => {
      const mockVolunteers = [createMockVolunteer()];
      mockVolunteerRepository.findAll.mockResolvedValue(mockVolunteers);

      const result = await volunteerService.getAllVolunteers(adminUser);

      expect(mockVolunteerRepository.findAll).toHaveBeenCalled();
      expect(result).toBe(mockVolunteers);
    });

    it('should throw ForbiddenError for non-admin user', async () => {
      await expect(
        volunteerService.getAllVolunteers(volunteerUser)
      ).rejects.toThrow('Only administrators can view all volunteers');

      expect(mockVolunteerRepository.findAll).not.toHaveBeenCalled();
    });
  });

  describe('getVolunteerById', () => {
    const volunteerId = 'volunteer-1';

    it('should return volunteer for admin user', async () => {
      const mockVolunteer = createMockVolunteer({ id: volunteerId });
      mockVolunteerRepository.findById.mockResolvedValue(mockVolunteer);

      const result = await volunteerService.getVolunteerById(volunteerId, adminUser);

      expect(mockVolunteerRepository.findById).toHaveBeenCalledWith(volunteerId);
      expect(result).toBe(mockVolunteer);
    });

    it('should return volunteer for owner', async () => {
      const mockVolunteer = createMockVolunteer({
        id: volunteerId,
        userId: volunteerUser.id,
      });
      mockVolunteerRepository.findById.mockResolvedValue(mockVolunteer);

      const result = await volunteerService.getVolunteerById(volunteerId, volunteerUser);

      expect(result).toBe(mockVolunteer);
    });

    it('should throw ForbiddenError for non-owner non-admin', async () => {
      const mockVolunteer = createMockVolunteer({
        id: volunteerId,
        userId: 'other-user',
      });
      mockVolunteerRepository.findById.mockResolvedValue(mockVolunteer);

      await expect(
        volunteerService.getVolunteerById(volunteerId, volunteerUser)
      ).rejects.toThrow('You can only view your own volunteer profile');
    });
  });

  describe('getCurrentUserProfile', () => {
    it('should return current user volunteer profile', async () => {
      const mockVolunteer = createMockVolunteer({ userId: volunteerUser.id });
      mockVolunteerRepository.findByUserId.mockResolvedValue(mockVolunteer);

      const result = await volunteerService.getCurrentUserProfile(volunteerUser);

      expect(mockVolunteerRepository.findByUserId).toHaveBeenCalledWith(volunteerUser.id);
      expect(result).toBe(mockVolunteer);
    });

    it('should throw NotFoundError when profile does not exist', async () => {
      mockVolunteerRepository.findByUserId.mockResolvedValue(null);

      await expect(
        volunteerService.getCurrentUserProfile(volunteerUser)
      ).rejects.toThrow('Volunteer profile not found. Please create your profile first.');
    });
  });

  describe('createProfile', () => {
    const validProfileData = {
      skills: ['JavaScript', 'React'],
      availability: ['Monday', 'Wednesday'],
      location: 'New York',
      preferredCauses: ['Education'],
      bio: 'Experienced developer',
    };

    it('should create volunteer profile successfully', async () => {
      const mockVolunteer = createMockVolunteer();
      
      mockVolunteerRepository.findByUserId.mockResolvedValue(null);
      mockVolunteerRepository.create.mockResolvedValue(mockVolunteer);

      const result = await volunteerService.createProfile(volunteerUser, validProfileData);

      expect(mockVolunteerRepository.findByUserId).toHaveBeenCalledWith(volunteerUser.id);
      expect(mockVolunteerRepository.create).toHaveBeenCalledWith({
        ...validProfileData,
        userId: volunteerUser.id,
      });
      expect(result).toBe(mockVolunteer);
    });

    it('should create profile with null bio when not provided', async () => {
      const dataWithoutBio = {
        skills: ['JavaScript'],
        availability: ['Monday'],
        location: 'New York',
        preferredCauses: ['Education'],
      };

      mockVolunteerRepository.findByUserId.mockResolvedValue(null);
      mockVolunteerRepository.create.mockResolvedValue(createMockVolunteer());

      await volunteerService.createProfile(volunteerUser, dataWithoutBio);

      expect(mockVolunteerRepository.create).toHaveBeenCalledWith({
        ...dataWithoutBio,
        userId: volunteerUser.id,
        bio: null,
      });
    });

    it('should throw ValidationError if profile already exists', async () => {
      const existingProfile = createMockVolunteer({ userId: volunteerUser.id });
      mockVolunteerRepository.findByUserId.mockResolvedValue(existingProfile);

      await expect(
        volunteerService.createProfile(volunteerUser, validProfileData)
      ).rejects.toThrow('Volunteer profile already exists for this user');

      expect(mockVolunteerRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    const updateData = {
      skills: ['Python', 'Django'],
      location: 'San Francisco',
    };

    it('should update volunteer profile successfully', async () => {
      const updatedVolunteer = createMockVolunteer(updateData);
      mockVolunteerRepository.updateByUserId.mockResolvedValue(updatedVolunteer);

      const result = await volunteerService.updateProfile(volunteerUser, updateData);

      expect(mockVolunteerRepository.updateByUserId).toHaveBeenCalledWith(
        volunteerUser.id,
        updateData
      );
      expect(result).toBe(updatedVolunteer);
    });
  });

  describe('updateVolunteerById', () => {
    const volunteerId = 'volunteer-1';
    const updateData = { location: 'Boston' };

    it('should update volunteer by ID for admin user', async () => {
      const mockVolunteer = createMockVolunteer({ id: volunteerId });
      const updatedVolunteer = { ...mockVolunteer, ...updateData };

      mockVolunteerRepository.findById.mockResolvedValue(mockVolunteer);
      mockVolunteerRepository.update.mockResolvedValue(updatedVolunteer);

      const result = await volunteerService.updateVolunteerById(
        volunteerId,
        adminUser,
        updateData
      );

      expect(mockVolunteerRepository.update).toHaveBeenCalledWith(volunteerId, updateData);
      expect(result).toBe(updatedVolunteer);
    });

    it('should update volunteer by ID for owner', async () => {
      const mockVolunteer = createMockVolunteer({
        id: volunteerId,
        userId: volunteerUser.id,
      });
      const updatedVolunteer = { ...mockVolunteer, ...updateData };

      mockVolunteerRepository.findById.mockResolvedValue(mockVolunteer);
      mockVolunteerRepository.update.mockResolvedValue(updatedVolunteer);

      const result = await volunteerService.updateVolunteerById(
        volunteerId,
        volunteerUser,
        updateData
      );

      expect(result).toBe(updatedVolunteer);
    });

    it('should throw ForbiddenError for non-owner non-admin', async () => {
      const mockVolunteer = createMockVolunteer({
        id: volunteerId,
        userId: 'other-user',
      });
      mockVolunteerRepository.findById.mockResolvedValue(mockVolunteer);

      await expect(
        volunteerService.updateVolunteerById(volunteerId, volunteerUser, updateData)
      ).rejects.toThrow('You can only update your own volunteer profile');
    });
  });

  describe('deleteProfile', () => {
    it('should delete volunteer profile successfully', async () => {
      const mockVolunteer = createMockVolunteer({ userId: volunteerUser.id });
      mockVolunteerRepository.findByUserId.mockResolvedValue(mockVolunteer);
      mockVolunteerRepository.delete.mockResolvedValue(undefined);

      await volunteerService.deleteProfile(volunteerUser);

      expect(mockVolunteerRepository.findByUserId).toHaveBeenCalledWith(volunteerUser.id);
      expect(mockVolunteerRepository.delete).toHaveBeenCalledWith(mockVolunteer.id);
    });

    it('should throw NotFoundError if profile does not exist', async () => {
      mockVolunteerRepository.findByUserId.mockResolvedValue(null);

      await expect(
        volunteerService.deleteProfile(volunteerUser)
      ).rejects.toThrow('Volunteer profile not found');

      expect(mockVolunteerRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('getPendingInvitations', () => {
    it('should return filtered pending invitations', async () => {
      const mockVolunteer = createMockVolunteer({ userId: volunteerUser.id });
      const futureDate = new Date(Date.now() + 86400000); // tomorrow
      
      const pendingMatches = [
        createMockEventMatch({
          event: {
            id: 'event-1',
            status: EventStatus.PUBLISHED,
            startTime: futureDate,
          },
        }),
        createMockEventMatch({
          event: {
            id: 'event-2',
            status: EventStatus.DRAFT, // Should be filtered out
            startTime: futureDate,
          },
        }),
        createMockEventMatch({
          event: {
            id: 'event-3',
            status: EventStatus.PUBLISHED,
            startTime: new Date(Date.now() - 86400000), // Past event - should be filtered out
          },
        }),
      ];

      mockVolunteerRepository.findByUserId.mockResolvedValue(mockVolunteer);
      mockEventMatchRepository.findByVolunteerIdAndStatus.mockResolvedValue(pendingMatches);

      const result = await volunteerService.getPendingInvitations(volunteerUser);

      expect(mockEventMatchRepository.findByVolunteerIdAndStatus).toHaveBeenCalledWith(
        mockVolunteer.id,
        MatchStatus.PENDING
      );
      
      // Should only return the first match (published + future)
      expect(result).toHaveLength(1);
      expect(result[0].event.id).toBe('event-1');
    });
  });

  describe('getAcceptedMatches', () => {
    it('should return filtered accepted matches', async () => {
      const mockVolunteer = createMockVolunteer({ userId: volunteerUser.id });
      const futureDate = new Date(Date.now() + 86400000);
      
      const acceptedMatches = [
        createMockEventMatch({
          event: {
            id: 'event-1',
            status: EventStatus.PUBLISHED,
            startTime: futureDate,
          },
        }),
      ];

      mockVolunteerRepository.findByUserId.mockResolvedValue(mockVolunteer);
      mockEventMatchRepository.findByVolunteerIdAndStatus.mockResolvedValue(acceptedMatches);

      const result = await volunteerService.getAcceptedMatches(volunteerUser);

      expect(mockEventMatchRepository.findByVolunteerIdAndStatus).toHaveBeenCalledWith(
        mockVolunteer.id,
        MatchStatus.ACCEPTED
      );
      expect(result).toEqual(acceptedMatches);
    });
  });

  describe('respondToInvitation', () => {
    const matchId = 'match-1';

    it('should accept invitation successfully', async () => {
      const mockMatch = {
        id: matchId,
        volunteerId: 'volunteer-1',
      };
      
      const mockVolunteer = createMockVolunteer({
        id: 'volunteer-1',
        userId: volunteerUser.id,
      });

      mockEventMatchRepository.findById.mockResolvedValue(mockMatch);
      mockVolunteerRepository.findById.mockResolvedValue(mockVolunteer);
      mockEventMatchRepository.update.mockResolvedValue(undefined);

      await volunteerService.respondToInvitation(
        volunteerUser,
        matchId,
        InvitationAction.ACCEPT
      );

      expect(mockEventMatchRepository.update).toHaveBeenCalledWith(matchId, {
        status: MatchStatus.ACCEPTED,
      });
    });

    it('should decline invitation successfully', async () => {
      const mockMatch = {
        id: matchId,
        volunteerId: 'volunteer-1',
      };
      
      const mockVolunteer = createMockVolunteer({
        id: 'volunteer-1',
        userId: volunteerUser.id,
      });

      mockEventMatchRepository.findById.mockResolvedValue(mockMatch);
      mockVolunteerRepository.findById.mockResolvedValue(mockVolunteer);
      mockEventMatchRepository.update.mockResolvedValue(undefined);

      await volunteerService.respondToInvitation(
        volunteerUser,
        matchId,
        InvitationAction.DECLINE
      );

      expect(mockEventMatchRepository.update).toHaveBeenCalledWith(matchId, {
        status: MatchStatus.DECLINED,
      });
    });

    it('should throw NotFoundError for non-existent match', async () => {
      mockEventMatchRepository.findById.mockResolvedValue(null);

      await expect(
        volunteerService.respondToInvitation(
          volunteerUser,
          matchId,
          InvitationAction.ACCEPT
        )
      ).rejects.toThrow('Invitation not found');
    });

    it('should throw ForbiddenError for non-owner', async () => {
      const mockMatch = {
        id: matchId,
        volunteerId: 'volunteer-1',
      };
      
      const mockVolunteer = createMockVolunteer({
        id: 'volunteer-1',
        userId: 'other-user', // Different user
      });

      mockEventMatchRepository.findById.mockResolvedValue(mockMatch);
      mockVolunteerRepository.findById.mockResolvedValue(mockVolunteer);

      await expect(
        volunteerService.respondToInvitation(
          volunteerUser,
          matchId,
          InvitationAction.ACCEPT
        )
      ).rejects.toThrow('You can only respond to your own invitations');

      expect(mockEventMatchRepository.update).not.toHaveBeenCalled();
    });
  });
});