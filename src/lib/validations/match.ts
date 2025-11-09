import { z } from 'zod';

export const inviteSchema = z.object({
  matchId: z.string().min(1, 'Match ID is required'),
});

export const respondToInvitationSchema = z.object({
  action: z.enum(['accept', 'decline']),
});
