import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth-handler';
import { UserRole } from '@prisma/client';

/**
 * GET /api/zoom/hosts
 * Get the default Zoom host for the organization
 * Admin only
 */
export const GET = withAuth(async (_user) => {
  const defaultHost = process.env.ZOOM_DEFAULT_HOST_ID;
  
  if (!defaultHost) {
    return NextResponse.json({
      error: 'No default Zoom host configured'
    }, { status: 500 });
  }
  
  return NextResponse.json({
    defaultHost,
    message: 'All virtual events are hosted by the organization Zoom account'
  }, { status: 200 });
}, UserRole.ADMIN);