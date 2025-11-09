import { Event, UserRole, EventType, EventStatus, MatchStatus } from '@prisma/client';
import { EventRepository, CreateEventData, UpdateEventData } from '@/lib/repositories/event.repository';
import { EventMatchRepository } from '@/lib/repositories/event-match.repository';
import { ZoomService } from '@/lib/services/zoom.service';
import { EmailService } from '@/lib/services/email.service';
import { ForbiddenError, ValidationError, NotFoundError } from '@/lib/errors';
import { CreateEventInput, UpdateEventInput } from '@/lib/validations/event';
import type { AuthUser } from '@/types/auth';

export class EventService {
  private eventRepository: EventRepository;
  private eventMatchRepository: EventMatchRepository;
  private zoomService: ZoomService;
  private emailService: EmailService;

  public constructor(
    eventRepository: EventRepository = new EventRepository(),
    eventMatchRepository: EventMatchRepository = new EventMatchRepository(),
    zoomService: ZoomService = new ZoomService(),
    emailService: EmailService = new EmailService(),
  ) {
    this.eventRepository = eventRepository;
    this.eventMatchRepository = eventMatchRepository;
    this.zoomService = zoomService;
    this.emailService = emailService;
  }

  /**
   * Create a new event
   */
  public async createEvent(user: AuthUser, validatedData: CreateEventInput): Promise<Event> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only administrators can create events');
    }

    const startTime = new Date(validatedData.startTime);
    if (startTime <= new Date()) {
      throw new ValidationError('Start time must be in the future');
    }

    const eventData: CreateEventData = {
      ...validatedData,
      startTime: new Date(validatedData.startTime),
      status: validatedData.status || EventStatus.DRAFT,
      meetingUrl: validatedData.meetingUrl || null,
      zoomMeetingId: validatedData.zoomMeetingId ?? null,
      registrationDeadline: validatedData.registrationDeadline ? new Date(validatedData.registrationDeadline) : null,
      maxVolunteers: validatedData.maxVolunteers || null,
    };

    return this.eventRepository.create(eventData);
  }

  /**
   * Update an existing event
   */
  public async updateEvent(id: string, user: AuthUser, validatedData: UpdateEventInput): Promise<Event> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only administrators can update events');
    }

    await this.eventRepository.findById(id);

    const updateData = {
      ...validatedData,
      ...(validatedData.startTime && { startTime: new Date(validatedData.startTime) }),
      ...(validatedData.meetingUrl !== undefined && { meetingUrl: validatedData.meetingUrl || null }),
      ...(validatedData.zoomMeetingId !== undefined && { zoomMeetingId: validatedData.zoomMeetingId ?? null }),
    };

    const updatedEvent = await this.eventRepository.update(id, updateData as UpdateEventData);

    await this.syncZoomMeetingIfNeeded(updatedEvent, validatedData);

    return updatedEvent;
  }

  /**
   * Synchronize Zoom meeting details when event is updated
   * 
   * TODO: Refactor to use event-driven architecture (e.g., message queue/pub-sub)
   * Currently this is a blocking I/O operation that couples event updates with Zoom API calls.
   * Consider emitting an "EventUpdated" event that a separate service can consume asynchronously.
   * This would improve performance, reliability (with retries), and separation of concerns.
   */
  private async syncZoomMeetingIfNeeded(event: Event, updates: UpdateEventInput): Promise<void> {
    if (event.eventType !== EventType.VIRTUAL || !event.zoomMeetingId) {
      return;
    }

    const zoomUpdates: Record<string, unknown> = {};
    
    if (updates.title) zoomUpdates.topic = updates.title;
    if (updates.description) zoomUpdates.agenda = updates.description;
    if (updates.startTime) zoomUpdates.start_time = new Date(updates.startTime).toISOString();
    if (updates.duration) zoomUpdates.duration = updates.duration;

    if (Object.keys(zoomUpdates).length === 0) {
      return;
    }

    try {
      await this.zoomService.updateMeeting(event.zoomMeetingId, zoomUpdates);
    } catch (_error) {
      // Silently fail - Zoom sync is not critical for event updates
    }
  }

  /**
   * Create a Zoom meeting for an existing virtual event
   */
  public async createZoomMeetingForEvent(id: string, user: AuthUser): Promise<Event> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only administrators can create Zoom meetings');
    }

    const event = await this.eventRepository.findById(id);

    if (event.eventType !== EventType.VIRTUAL) {
      throw new ValidationError('Can only create Zoom meetings for virtual events');
    }

    if (event.zoomMeetingId) {
      throw new ValidationError('Event already has a Zoom meeting');
    }

    const meeting = await this.zoomService.createMeetingForEvent({
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      duration: event.duration,
    });

    return this.eventRepository.update(event.id, {
      meetingUrl: meeting.join_url,
      zoomMeetingId: BigInt(meeting.id),
    });
  }

  /**
   * Delete an event
   */
  public async deleteEvent(id: string, user: AuthUser): Promise<void> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only administrators can delete events');
    }

    const event = await this.eventRepository.findById(id);

    if (event.eventType === EventType.VIRTUAL && event.zoomMeetingId) {
      try {
        await this.zoomService.deleteMeeting(event.zoomMeetingId);
      } catch (error) {
        console.error('Failed to delete Zoom meeting:', error);
      }
    }

    return this.eventRepository.delete(id);
  }

  /**
   * Get events that match volunteer skills (for recommendations)
   */
  public async getRecommendedEvents(volunteerSkills: string[]): Promise<Event[]> {
    if (!volunteerSkills.length) {
      return [];
    }

    return this.eventRepository.findBySkills(volunteerSkills);
  }

  /**
   * Send invitation email to a matched volunteer
   * Admin only, event must be PUBLISHED
   */
  public async sendInvitation(
    eventId: string,
    matchId: string,
    user: AuthUser
  ): Promise<void> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only administrators can send invitations');
    }

    const event = await this.eventRepository.findById(eventId);
    
    if (event.status !== EventStatus.PUBLISHED) {
      throw new ValidationError('Can only send invitations for published events');
    }

    const match = await this.eventMatchRepository.findById(matchId);
    
    if (!match) {
      throw new NotFoundError('Match not found');
    }

    if (match.eventId !== eventId) {
      throw new ValidationError('Match does not belong to this event');
    }

    if (match.status !== MatchStatus.PENDING) {
      throw new ValidationError('Can only send invitations to pending matches');
    }

    await this.emailService.sendEventInvitation(match.volunteer, event, match.id);

    await this.eventMatchRepository.update(match.id, {
      emailSentAt: new Date(),
      notified: true,
    });
  }
}

export const eventService = new EventService();