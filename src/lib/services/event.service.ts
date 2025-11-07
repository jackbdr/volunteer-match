import { Event, UserRole } from '@prisma/client';
import { EventRepository, CreateEventData, UpdateEventData } from '@/lib/repositories/event.repository';
import { ForbiddenError, ValidationError } from '@/lib/errors';
import { createEventSchema } from '@/lib/validations/event';
import type { AuthUser } from '@/lib/types/auth';

export class EventService {
  private eventRepository: EventRepository;

  public constructor(eventRepository: EventRepository = new EventRepository()) {
    this.eventRepository = eventRepository;
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
      meetingUrl: validatedData.meetingUrl || null,
      zoomMeetingId: validatedData.zoomMeetingId || null,
      isActive: true,
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

    return this.eventRepository.update(id, updateData as UpdateEventData);
  }

  /**
   * Delete an event
   */
  public async deleteEvent(id: string, user: AuthUser): Promise<void> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only administrators can delete events');
    }

    await this.eventRepository.findById(id);

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