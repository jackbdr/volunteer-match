import { z } from 'zod';
import { INVITATION_ACTIONS } from '@/types/invitation';

export const inviteSchema = z.object({
  matchId: z.string().min(1, 'Match ID is required'),
});

export const respondToInvitationSchema = z.object({
  action: z.enum(INVITATION_ACTIONS),
});
