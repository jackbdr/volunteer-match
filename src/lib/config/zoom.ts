/**
 * Zoom API configuration and utilities
 */

export const ZOOM_CONFIG = {
  ACCOUNT_ID: process.env.ZOOM_ACCOUNT_ID,
  CLIENT_ID: process.env.ZOOM_CLIENT_ID,
  CLIENT_SECRET: process.env.ZOOM_CLIENT_SECRET,
  
  DEFAULT_HOST_ID: process.env.ZOOM_DEFAULT_HOST_ID,
  
  WEBHOOK_SECRET: process.env.ZOOM_WEBHOOK_SECRET,
  
  API_BASE_URL: 'https://api.zoom.us/v2',
  
  DEFAULT_MEETING_SETTINGS: {
    host_video: true,
    participant_video: true,
    join_before_host: true,
    mute_upon_entry: true,
    watermark: false,
    use_pmi: false,
    approval_type: 0,
    auto_recording: 'none' as const,
    waiting_room: false,
    request_permission_to_unmute_participants: false,
    meeting_authentication: false,
  },
} as const;

/**
 * Validate that required Zoom environment variables are set
 */
export function validateZoomConfig(): void {
  const required = [
    'ZOOM_ACCOUNT_ID',
    'ZOOM_CLIENT_ID', 
    'ZOOM_CLIENT_SECRET',
    'ZOOM_WEBHOOK_SECRET',
    'ZOOM_DEFAULT_HOST_ID',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required Zoom environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all Zoom configuration is set.\n' +
      'For production, use ACCOUNT_ID/CLIENT_ID/CLIENT_SECRET instead of manual tokens.'
    );
  }
}

/**
 * Get Zoom user ID mapping (placeholder for now)
 * In a real implementation, you'd maintain a mapping between your users and Zoom users
 */
export function getZoomUserIdForUser(userEmail: string): string {
  // For now, assume the user's email matches their Zoom account email
  return userEmail;
}