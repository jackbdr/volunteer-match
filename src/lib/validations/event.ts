import { z } from 'zod';
import { EventType, EventStatus } from '@prisma/client';

export const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  eventType: z.enum([EventType.VIRTUAL, EventType.PHYSICAL]),
  status: z.enum([EventStatus.DRAFT, EventStatus.PUBLISHED, EventStatus.CANCELLED, EventStatus.COMPLETED]).optional().default(EventStatus.DRAFT),
  requiredSkills: z.array(z.string()).min(1, 'At least one skill is required'),
  location: z.string().min(2),
  timeSlot: z.string().min(1),
  startTime: z.iso.datetime(),
  duration: z.number().int().min(30, 'Duration must be at least 30 minutes').max(480, 'Duration cannot exceed 8 hours'),
  meetingUrl: z.url().optional(),
  zoomMeetingId: z.string().optional(),
  registrationDeadline: z.iso.datetime().optional(),
  maxVolunteers: z.number().int().min(1).optional(),
});

export const updateEventSchema = createEventSchema.partial();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
