import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth-handler';
import { zoomUserService } from '@/lib/services/zoom-user.service';

/**
 * GET /api/zoom/connect
 * Check if current user has Zoom connected
 */
export const GET = withAuth(async (user) => {
  const isConnected = await zoomUserService.isZoomConnected(user.id);
  
  return NextResponse.json({ 
    connected: isConnected,
    userId: user.id,
    message: isConnected 
      ? 'Zoom account is connected' 
      : 'No Zoom account connected. You can still create events - they will be hosted by the default organization account.'
  }, { status: 200 });
});

/**
 * POST /api/zoom/connect
 * Connect user's Zoom account (called after OAuth flow)
 */
export const POST = withAuth(async (user, request: NextRequest) => {
  const data = await request.json();
  const { zoomUserId, zoomEmail, tokens } = data;

  if (!zoomUserId || !zoomEmail) {
    return NextResponse.json({ error: 'Missing required Zoom user data' }, { status: 400 });
  }

  await zoomUserService.connectZoomAccount(user.id, zoomUserId, zoomEmail, tokens);

  return NextResponse.json({ 
    success: true,
    message: 'Zoom account connected successfully',
    zoomEmail 
  }, { status: 200 });
});

/**
 * DELETE /api/zoom/connect
 * Disconnect user's Zoom account
 */
export const DELETE = withAuth(async (user) => {
  await zoomUserService.disconnectZoomAccount(user.id);

  return NextResponse.json({ 
    success: true,
    message: 'Zoom account disconnected successfully'
  }, { status: 200 });
});