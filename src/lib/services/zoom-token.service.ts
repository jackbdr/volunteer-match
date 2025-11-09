/**
 * Production-ready Zoom Token Management Service
 * Handles automatic token refresh for Server-to-Server OAuth
 */

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

export class ZoomTokenService {
  private static instance: ZoomTokenService;
  private tokenCache: TokenCache | null = null;
  
  private constructor() {}
  
  public static getInstance(): ZoomTokenService {
    if (!ZoomTokenService.instance) {
      ZoomTokenService.instance = new ZoomTokenService();
    }
    return ZoomTokenService.instance;
  }

  /**
   * Get valid access token (auto-refreshes if needed)
   */
  public async getAccessToken(): Promise<string> {
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
      return this.tokenCache.accessToken;
    }

    const newToken = await this.refreshToken();
    return newToken;
  }

  /**
   * Refresh the Server-to-Server OAuth token
   */
  private async refreshToken(): Promise<string> {
    const accountId = process.env.ZOOM_ACCOUNT_ID;
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;

    if (!accountId || !clientId || !clientSecret) {
      throw new Error('Missing Zoom OAuth credentials. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET');
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=account_credentials&account_id=${accountId}`,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Zoom token refresh failed:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Failed to refresh Zoom token: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    this.tokenCache = {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 300) * 1000, // 5-minute safety buffer
    };

    return data.access_token;
  }

  /**
   * Clear token cache (force refresh on next request)
   */
  public clearCache(): void {
    this.tokenCache = null;
  }
}

export const zoomTokenService = ZoomTokenService.getInstance();