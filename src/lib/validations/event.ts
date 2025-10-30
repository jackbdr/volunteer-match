import { z } from 'zod';
import { EventType } from '@prisma/client';

export const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  eventType: z.enum(EventType),
  requiredSkills: z.array(z.string()).min(1, 'At least one skill is required'),
  timeSlot: z.string().min(1),
  location: z.string().min(2),
  startTime: z.iso.datetime(),
  duration: z.number().int().min(30, 'Duration must be at least 30 minutes').max(480, 'Duration cannot exceed 8 hours'),
});

export const updateEventSchema = createEventSchema.partial();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
