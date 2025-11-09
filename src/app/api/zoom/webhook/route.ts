import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/middleware/error-handler';
import { zoomService } from '@/lib/services/zoom.service';
import { zoomWebhookSchema } from '@/lib/validations/zoom';

/**
 * POST /api/zoom/webhook
 * Handle Zoom webhook events
 * Public endpoint (authenticated via webhook signature)
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const rawBody = await request.text();
  const signature = request.headers.get('authorization') || '';
  const timestamp = request.headers.get('x-zm-request-timestamp') || '';

  const isValid = zoomService.validateWebhookSignature(rawBody, signature, timestamp);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);
    const validatedPayload = zoomWebhookSchema.parse(payload);

    switch (validatedPayload.event) {
      case 'meeting.started':
        // TODO: Update event status in database
        break;
        
      case 'meeting.ended':
        // TODO: Update event status in database
        break;
        
      case 'meeting.participant_joined':
        // TODO: Track attendance
        break;
        
      case 'meeting.participant_left':
        // TODO: Track attendance
        break;
        
      default:
        // Unhandled webhook event
        break;
    }

    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }
});