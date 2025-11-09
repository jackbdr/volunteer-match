import axios, { AxiosInstance } from 'axios';
import { ZoomMeeting, ZoomMeetingRequest, ZoomMeetingUpdate, ZoomApiError } from '@/lib/types/zoom';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { zoomTokenService } from './zoom-token.service';

/**
 * Zoom API Service for meeting management
 * Handles all Zoom API interactions following clean architecture principles
 */
export class ZoomService {
  private readonly apiClient: AxiosInstance;
  private readonly baseUrl = 'https://api.zoom.us/v2';

  public constructor(accessToken?: string) {
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
    });

    this.apiClient.interceptors.request.use(async (config) => {
      let token: string;
      
      if (accessToken) {
        token = accessToken;
      } else {
        token = await zoomTokenService.getAccessToken();
      }

      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
      config.headers['Content-Type'] = 'application/json';
      
      return config;
    });

    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data) {
          const zoomError: ZoomApiError = error.response.data;
          throw new ValidationError(`Zoom API Error: ${zoomError.message} (Code: ${zoomError.code})`);
        }
        throw new ValidationError(`Zoom API request failed: ${error.message}`);
      }
    );
  }

  /**
   * Create a new Zoom meeting
   */
  public async createMeeting(userId: string, meetingData: ZoomMeetingRequest): Promise<ZoomMeeting> {
    try {
      const response = await this.apiClient.post(`/users/${userId}/meetings`, meetingData);
      return response.data;
    } catch (error) {
      throw new ValidationError(`Failed to create Zoom meeting: ${error}`);
    }
  }

  /**
   * Get meeting details by ID
   */
  public async getMeeting(meetingId: string): Promise<ZoomMeeting> {
    try {
      const response = await this.apiClient.get(`/meetings/${meetingId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new NotFoundError(`Zoom meeting ${meetingId} not found`);
      }
      throw new ValidationError(`Failed to get Zoom meeting: ${error}`);
    }
  }

  /**
   * Update an existing Zoom meeting
   */
  public async updateMeeting(meetingId: string, updates: ZoomMeetingUpdate): Promise<ZoomMeeting> {
    try {
      await this.apiClient.patch(`/meetings/${meetingId}`, updates);
      return this.getMeeting(meetingId);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new NotFoundError(`Zoom meeting ${meetingId} not found`);
      }
      throw new ValidationError(`Failed to update Zoom meeting: ${error}`);
    }
  }

  /**
   * Delete a Zoom meeting
   */
  public async deleteMeeting(meetingId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/meetings/${meetingId}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new NotFoundError(`Zoom meeting ${meetingId} not found`);
      }
      throw new ValidationError(`Failed to delete Zoom meeting: ${error}`);
    }
  }

  /**
   * Create meeting data from event information
   */
  public createMeetingFromEvent(event: {
    title: string;
    description: string;
    startTime: Date;
    duration: number;
  }): ZoomMeetingRequest {
    return {
      topic: event.title,
      type: 2, // Scheduled meeting
      start_time: event.startTime.toISOString(),
      duration: event.duration,
      timezone: 'UTC',
      agenda: event.description,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        mute_upon_entry: true,
        watermark: false,
        use_pmi: false,
        approval_type: 0,
        auto_recording: 'none',
        waiting_room: false,
        request_permission_to_unmute_participants: false,
        meeting_authentication: false,
      },
    };
  }

  /**
   * Create a Zoom meeting for a virtual event
   * Handles host verification and meeting creation
   */
  public async createMeetingForEvent(event: {
    title: string;
    description: string;
    startTime: Date;
    duration: number;
  }): Promise<ZoomMeeting> {
    const defaultHostId = process.env.ZOOM_DEFAULT_HOST_ID;
    if (!defaultHostId) {
      throw new Error('ZOOM_DEFAULT_HOST_ID not configured');
    }

    try {
      await this.apiClient.get(`/users/${defaultHostId}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error(`Zoom user ${defaultHostId} does not exist. Please check ZOOM_DEFAULT_HOST_ID in your environment variables.`);
      }
      throw error;
    }

    const meetingData = this.createMeetingFromEvent(event);
    return this.createMeeting(defaultHostId, meetingData);
  }

  /**
   * Validate Zoom webhook signature
   */
  public validateWebhookSignature(payload: string, signature: string, timestamp: string): boolean {
    const webhookSecret = process.env.ZOOM_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Zoom webhook secret is not configured');
    }

    // Implementation here - this is a placeholder
    return true;
  }
}

// Export singleton instance for use in application
export const zoomService = new ZoomService();