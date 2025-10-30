import { z } from 'zod';

export const createVolunteerSchema = z.object({
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  availability: z.array(z.string()).min(1, 'At least one time slot is required'),
  location: z.string().min(2),
  preferredCauses: z.array(z.string()).min(1, 'At least one cause is required'),
  bio: z.string().max(500).optional(),
});

export const updateVolunteerSchema = createVolunteerSchema.partial();

export type CreateVolunteerInput = z.infer<typeof createVolunteerSchema>;
export type UpdateVolunteerInput = z.infer<typeof updateVolunteerSchema>;
