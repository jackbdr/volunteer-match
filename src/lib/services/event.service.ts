import { Event, UserRole, EventType } from '@prisma/client';
import { EventRepository, CreateEventData, UpdateEventData } from '@/lib/repositories/event.repository';
import { ZoomService } from '@/lib/services/zoom.service';
import { ForbiddenError, ValidationError } from '@/lib/errors';
import { createEventSchema } from '@/lib/validations/event';
import type { AuthUser } from '@/lib/types/auth';

export class EventService {
  private eventRepository: EventRepository;
  private zoomService: ZoomService;

  public constructor(
    eventRepository: EventRepository = new EventRepository(),
    zoomService: ZoomService = new ZoomService(),
  ) {
    this.eventRepository = eventRepository;
    this.zoomService = zoomService;
  }

  /**
   * Create a new event
   */
  public async createEvent(user: AuthUser, data: unknown): Promise<Event> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only administrators can create events');
    }

    const validatedData = createEventSchema.parse(data);

    const startTime = new Date(validatedData.startTime);
    if (startTime <= new Date()) {
      throw new ValidationError('Start time must be in the future');
    }

    const eventData: CreateEventData = {
      ...validatedData,
      startTime: new Date(validatedData.startTime),
      status: validatedData.status || 'DRAFT',
      meetingUrl: validatedData.meetingUrl || null,
      zoomMeetingId: validatedData.zoomMeetingId || null,
      registrationDeadline: validatedData.registrationDeadline ? new Date(validatedData.registrationDeadline) : null,
      maxVolunteers: validatedData.maxVolunteers || null,
    };

    return this.eventRepository.create(eventData);
  }

  /**
   * Update an existing event
   */
  public async updateEvent(id: string, user: AuthUser, data: unknown): Promise<Event> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only administrators can update events');
    }

    await this.eventRepository.findById(id);

    const validatedData = createEventSchema.partial().parse(data);

    const updateData = {
      ...validatedData,
      ...(validatedData.startTime && { startTime: new Date(validatedData.startTime) }),
      ...(validatedData.meetingUrl !== undefined && { meetingUrl: validatedData.meetingUrl || null }),
      ...(validatedData.zoomMeetingId !== undefined && { zoomMeetingId: validatedData.zoomMeetingId || null }),
    };

    const updatedEvent = await this.eventRepository.update(id, updateData as UpdateEventData);

    // If updating a virtual event and it has a Zoom meeting, update the Zoom meeting too
    if (updatedEvent.eventType === EventType.VIRTUAL && updatedEvent.zoomMeetingId) {
      try {
        const zoomUpdates: Record<string, unknown> = {};
        
        if (validatedData.title) zoomUpdates.topic = validatedData.title;
        if (validatedData.description) zoomUpdates.agenda = validatedData.description;
        if (validatedData.startTime) zoomUpdates.start_time = new Date(validatedData.startTime).toISOString();
        if (validatedData.duration) zoomUpdates.duration = validatedData.duration;

        if (Object.keys(zoomUpdates).length > 0) {
          await this.zoomService.updateMeeting(updatedEvent.zoomMeetingId, zoomUpdates);
        }
      } catch (error) {
        console.error('Failed to update Zoom meeting:', error);
      }
    }

    return updatedEvent;
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
      zoomMeetingId: meeting.id,
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
}

export const eventService = new EventService();