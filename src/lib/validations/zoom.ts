import { z } from 'zod';

/**
 * Validation schemas for Zoom-related operations
 */

export const createZoomMeetingSchema = z.object({
  topic: z.string().min(1, 'Meeting topic is required').max(200, 'Topic must be 200 characters or less'),
  start_time: z.string().datetime().optional(),
  duration: z.number().int().min(1, 'Duration must be at least 1 minute').max(1440, 'Duration cannot exceed 24 hours').optional(),
  timezone: z.string().optional().default('UTC'),
  agenda: z.string().max(2000, 'Agenda must be 2000 characters or less').optional(),
  settings: z.object({
    host_video: z.boolean().optional().default(true),
    participant_video: z.boolean().optional().default(true),
    join_before_host: z.boolean().optional().default(true),
    mute_upon_entry: z.boolean().optional().default(true),
    watermark: z.boolean().optional().default(false),
    use_pmi: z.boolean().optional().default(false),
    approval_type: z.number().int().min(0).max(2).optional().default(0),
    auto_recording: z.enum(['local', 'cloud', 'none']).optional().default('none'),
    waiting_room: z.boolean().optional().default(false),
    request_permission_to_unmute_participants: z.boolean().optional().default(false),
    meeting_authentication: z.boolean().optional().default(false),
  }).optional(),
});

export const updateZoomMeetingSchema = z.object({
  topic: z.string().min(1, 'Meeting topic is required').max(200, 'Topic must be 200 characters or less').optional(),
  start_time: z.string().datetime().optional(),
  duration: z.number().int().min(1, 'Duration must be at least 1 minute').max(1440, 'Duration cannot exceed 24 hours').optional(),
  timezone: z.string().optional(),
  agenda: z.string().max(2000, 'Agenda must be 2000 characters or less').optional(),
  settings: z.object({
    host_video: z.boolean().optional(),
    participant_video: z.boolean().optional(),
    join_before_host: z.boolean().optional(),
    mute_upon_entry: z.boolean().optional(),
    watermark: z.boolean().optional(),
    waiting_room: z.boolean().optional(),
  }).optional(),
});

export const zoomWebhookSchema = z.object({
  event: z.string(),
  payload: z.object({
    account_id: z.string(),
    object: z.object({
      uuid: z.string(),
      id: z.string(),
      host_id: z.string(),
      topic: z.string(),
      type: z.number(),
      start_time: z.string(),
      duration: z.number(),
      timezone: z.string(),
      status: z.string(),
    }),
  }),
});