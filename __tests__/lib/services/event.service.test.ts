import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EventType, EventStatus, UserRole } from '@prisma/client';
import { EventService } from '@/lib/services/event.service';
import type { EventRepository } from '@/lib/repositories/event.repository';
import type { EventMatchRepository } from '@/lib/repositories/event-match.repository';
import type { ZoomService } from '@/lib/services/zoom.service';
import type { EmailService } from '@/lib/services/email.service';
import { createMockEvent } from '../../test-utils';

// Mock dependencies
const mockEventRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findBySkills: jest.fn(),
};

const mockEventMatchRepository = {
  findById: jest.fn(),
  update: jest.fn(),
};

const mockZoomService = {
  createMeetingForEvent: jest.fn(),
  updateMeeting: jest.fn(),
  deleteMeeting: jest.fn(),
};

const mockEmailService = {
  sendEventInvitation: jest.fn(),
};

describe('EventService', () => {
  let eventService: EventService;
  const adminUser = { id: 'admin-1', email: 'admin@example.com', role: UserRole.ADMIN };
  const volunteerUser = { id: 'volunteer-1', email: 'volunteer@example.com', role: UserRole.VOLUNTEER };

  beforeEach(() => {
    // Reset all mocks
    Object.values(mockEventRepository).forEach((mock) => (mock as jest.Mock).mockReset());
    Object.values(mockEventMatchRepository).forEach((mock) => (mock as jest.Mock).mockReset());
    Object.values(mockZoomService).forEach((mock) => (mock as jest.Mock).mockReset());
    Object.values(mockEmailService).forEach((mock) => (mock as jest.Mock).mockReset());

    // Create service with mocked dependencies
    eventService = new EventService(
      mockEventRepository as unknown as EventRepository,
      mockEventMatchRepository as unknown as EventMatchRepository,
      mockZoomService as unknown as ZoomService,
      mockEmailService as unknown as EmailService
    );
  });

  describe('createEvent', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Tomorrow
    const validEventInput = {
      title: 'Test Event',
      description: 'Test event description',
      eventType: EventType.VIRTUAL,
      requiredSkills: ['JavaScript'],
      location: 'Virtual',
      timeSlot: futureDate,
      startTime: futureDate,
      duration: 60,
    };

    it('should create event successfully for admin user', async () => {
      const mockEvent = createMockEvent();
      mockEventRepository.create.mockResolvedValue(mockEvent);

      const result = await eventService.createEvent(adminUser, validEventInput);

      expect(mockEventRepository.create).toHaveBeenCalledWith({
        ...validEventInput,
        startTime: new Date(validEventInput.startTime),
        status: EventStatus.DRAFT,
        meetingUrl: null,
        zoomMeetingId: null,
        registrationDeadline: null,
        maxVolunteers: null,
      });
      expect(result).toBe(mockEvent);
    });

    it('should throw ForbiddenError for non-admin user', async () => {
      await expect(
        eventService.createEvent(volunteerUser, validEventInput)
      ).rejects.toThrow('Only administrators can create events');

      expect(mockEventRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for past start time', async () => {
      const pastEventInput = {
        ...validEventInput,
        startTime: '2020-01-01T10:00:00Z',
      };

      await expect(
        eventService.createEvent(adminUser, pastEventInput)
      ).rejects.toThrow('Start time must be in the future');

      expect(mockEventRepository.create).not.toHaveBeenCalled();
    });

    it('should handle optional fields correctly', async () => {
      const eventWithOptionals = {
        ...validEventInput,
        status: EventStatus.PUBLISHED,
        meetingUrl: 'https://zoom.us/j/123',
        zoomMeetingId: BigInt(123456789),
        registrationDeadline: '2024-11-30T23:59:59Z',
        maxVolunteers: 10,
      };

      const mockEvent = createMockEvent();
      mockEventRepository.create.mockResolvedValue(mockEvent);

      await eventService.createEvent(adminUser, eventWithOptionals);

      expect(mockEventRepository.create).toHaveBeenCalledWith({
        ...eventWithOptionals,
        startTime: new Date(eventWithOptionals.startTime),
        registrationDeadline: new Date(eventWithOptionals.registrationDeadline),
      });
    });
  });

  describe('updateEvent', () => {
    const eventId = 'event-1';
    const updateInput = {
      title: 'Updated Title',
      duration: 90,
    };

    it('should update event successfully for admin user', async () => {
      const existingEvent = createMockEvent();
      const updatedEvent = { ...existingEvent, ...updateInput };

      mockEventRepository.findById.mockResolvedValue(existingEvent);
      mockEventRepository.update.mockResolvedValue(updatedEvent);

      const result = await eventService.updateEvent(eventId, adminUser, updateInput);

      expect(mockEventRepository.findById).toHaveBeenCalledWith(eventId);
      expect(mockEventRepository.update).toHaveBeenCalledWith(eventId, updateInput);
      expect(result).toBe(updatedEvent);
    });

    it('should throw ForbiddenError for non-admin user', async () => {
      await expect(
        eventService.updateEvent(eventId, volunteerUser, updateInput)
      ).rejects.toThrow('Only administrators can update events');

      expect(mockEventRepository.findById).not.toHaveBeenCalled();
    });

    it('should update Zoom meeting for virtual events with Zoom meeting', async () => {
      const virtualEvent = createMockEvent({
        eventType: EventType.VIRTUAL,
        zoomMeetingId: BigInt(123456789),
      });

      const updateWithZoomFields = {
        title: 'Updated Virtual Event',
        startTime: '2024-12-02T14:00:00Z',
        duration: 120,
      };

      mockEventRepository.findById.mockResolvedValue(virtualEvent);
      mockEventRepository.update.mockResolvedValue({
        ...virtualEvent,
        ...updateWithZoomFields,
      });
      mockZoomService.updateMeeting.mockResolvedValue(undefined);

      await eventService.updateEvent(eventId, adminUser, updateWithZoomFields);

      expect(mockZoomService.updateMeeting).toHaveBeenCalledWith(
        virtualEvent.zoomMeetingId,
        {
          topic: updateWithZoomFields.title,
          start_time: new Date(updateWithZoomFields.startTime).toISOString(),
          duration: updateWithZoomFields.duration,
        }
      );
    });

    it('should handle Zoom update failures gracefully', async () => {
      const virtualEvent = createMockEvent({
        eventType: EventType.VIRTUAL,
        zoomMeetingId: BigInt(123456789),
      });

      mockEventRepository.findById.mockResolvedValue(virtualEvent);
      mockEventRepository.update.mockResolvedValue(virtualEvent);
      mockZoomService.updateMeeting.mockRejectedValue(new Error('Zoom API error'));

      // Should not throw error even if Zoom update fails
      await expect(
        eventService.updateEvent(eventId, adminUser, { title: 'New Title' })
      ).resolves.toBeDefined();
    });
  });

  describe('createZoomMeetingForEvent', () => {
    const eventId = 'event-1';

    it('should create Zoom meeting for virtual event', async () => {
      const virtualEvent = createMockEvent({
        eventType: EventType.VIRTUAL,
        zoomMeetingId: null,
      });

      const mockZoomMeeting = {
        id: 123456789,
        join_url: 'https://zoom.us/j/123456789',
      };

      mockEventRepository.findById.mockResolvedValue(virtualEvent);
      mockZoomService.createMeetingForEvent.mockResolvedValue(mockZoomMeeting);
      mockEventRepository.update.mockResolvedValue({
        ...virtualEvent,
        meetingUrl: mockZoomMeeting.join_url,
        zoomMeetingId: BigInt(mockZoomMeeting.id),
      });

      const result = await eventService.createZoomMeetingForEvent(eventId, adminUser);

      expect(mockZoomService.createMeetingForEvent).toHaveBeenCalledWith({
        title: virtualEvent.title,
        description: virtualEvent.description,
        startTime: virtualEvent.startTime,
        duration: virtualEvent.duration,
      });

      expect(mockEventRepository.update).toHaveBeenCalledWith(eventId, {
        meetingUrl: mockZoomMeeting.join_url,
        zoomMeetingId: BigInt(mockZoomMeeting.id),
      });

      expect(result.meetingUrl).toBe(mockZoomMeeting.join_url);
    });

    it('should throw error for physical event', async () => {
      const physicalEvent = createMockEvent({
        eventType: EventType.PHYSICAL,
      });

      mockEventRepository.findById.mockResolvedValue(physicalEvent);

      await expect(
        eventService.createZoomMeetingForEvent(eventId, adminUser)
      ).rejects.toThrow('Can only create Zoom meetings for virtual events');
    });

    it('should throw error if event already has Zoom meeting', async () => {
      const eventWithZoom = createMockEvent({
        eventType: EventType.VIRTUAL,
        zoomMeetingId: BigInt(987654321),
      });

      mockEventRepository.findById.mockResolvedValue(eventWithZoom);

      await expect(
        eventService.createZoomMeetingForEvent(eventId, adminUser)
      ).rejects.toThrow('Event already has a Zoom meeting');
    });

    it('should throw ForbiddenError for non-admin user', async () => {
      await expect(
        eventService.createZoomMeetingForEvent(eventId, volunteerUser)
      ).rejects.toThrow('Only administrators can create Zoom meetings');
    });
  });

  describe('deleteEvent', () => {
    const eventId = 'event-1';

    it('should delete event and Zoom meeting if exists', async () => {
      const eventWithZoom = createMockEvent({
        eventType: EventType.VIRTUAL,
        zoomMeetingId: BigInt(123456789),
      });

      mockEventRepository.findById.mockResolvedValue(eventWithZoom);
      mockZoomService.deleteMeeting.mockResolvedValue(undefined);
      mockEventRepository.delete.mockResolvedValue(undefined);

      await eventService.deleteEvent(eventId, adminUser);

      expect(mockZoomService.deleteMeeting).toHaveBeenCalledWith(eventWithZoom.zoomMeetingId);
      expect(mockEventRepository.delete).toHaveBeenCalledWith(eventId);
    });

    it('should handle Zoom deletion failures gracefully', async () => {
      const eventWithZoom = createMockEvent({
        eventType: EventType.VIRTUAL,
        zoomMeetingId: BigInt(123456789),
      });

      mockEventRepository.findById.mockResolvedValue(eventWithZoom);
      mockZoomService.deleteMeeting.mockRejectedValue(new Error('Zoom API error'));
      mockEventRepository.delete.mockResolvedValue(undefined);

      await eventService.deleteEvent(eventId, adminUser);

      expect(mockEventRepository.delete).toHaveBeenCalledWith(eventId);
    });

    it('should throw ForbiddenError for non-admin user', async () => {
      await expect(
        eventService.deleteEvent(eventId, volunteerUser)
      ).rejects.toThrow('Only administrators can delete events');
    });
  });

  describe('getRecommendedEvents', () => {
    it('should return events matching volunteer skills', async () => {
      const skills = ['JavaScript', 'React'];
      const mockEvents = [createMockEvent()];

      mockEventRepository.findBySkills.mockResolvedValue(mockEvents);

      const result = await eventService.getRecommendedEvents(skills);

      expect(mockEventRepository.findBySkills).toHaveBeenCalledWith(skills);
      expect(result).toBe(mockEvents);
    });

    it('should return empty array for no skills', async () => {
      const result = await eventService.getRecommendedEvents([]);

      expect(result).toEqual([]);
      expect(mockEventRepository.findBySkills).not.toHaveBeenCalled();
    });
  });

  describe('sendInvitation', () => {
    const eventId = 'event-1';
    const matchId = 'match-1';

    it('should send invitation successfully for admin user', async () => {
      const publishedEvent = createMockEvent({
        status: EventStatus.PUBLISHED,
      });

      const pendingMatch = {
        id: matchId,
        eventId,
        volunteerId: 'volunteer-1',
        status: 'PENDING',
        volunteer: {
          user: {
            id: 'user-1',
            email: 'volunteer@example.com',
            name: 'John Doe',
          }
        }
      };

      mockEventRepository.findById.mockResolvedValue(publishedEvent);
      mockEventMatchRepository.findById.mockResolvedValue(pendingMatch);
      mockEmailService.sendEventInvitation.mockResolvedValue(undefined);
      mockEventMatchRepository.update.mockResolvedValue(undefined);

      await eventService.sendInvitation(eventId, matchId, adminUser);

      expect(mockEmailService.sendEventInvitation).toHaveBeenCalledWith(
        pendingMatch.volunteer,
        publishedEvent,
        matchId
      );

      expect(mockEventMatchRepository.update).toHaveBeenCalledWith(matchId, {
        emailSentAt: expect.any(Date),
        notified: true,
      });
    });

    it('should throw error for non-published event', async () => {
      const draftEvent = createMockEvent({
        status: EventStatus.DRAFT,
      });

      mockEventRepository.findById.mockResolvedValue(draftEvent);

      await expect(
        eventService.sendInvitation(eventId, matchId, adminUser)
      ).rejects.toThrow('Can only send invitations for published events');
    });

    it('should throw error for non-pending match', async () => {
      const publishedEvent = createMockEvent({
        status: EventStatus.PUBLISHED,
      });

      const acceptedMatch = {
        id: matchId,
        eventId,
        status: 'ACCEPTED',
      };

      mockEventRepository.findById.mockResolvedValue(publishedEvent);
      mockEventMatchRepository.findById.mockResolvedValue(acceptedMatch);

      await expect(
        eventService.sendInvitation(eventId, matchId, adminUser)
      ).rejects.toThrow('Can only send invitations to pending matches');
    });

    it('should throw ForbiddenError for non-admin user', async () => {
      await expect(
        eventService.sendInvitation(eventId, matchId, volunteerUser)
      ).rejects.toThrow('Only administrators can send invitations');
    });
  });
});