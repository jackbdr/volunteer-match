import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth-handler';
import { volunteerService } from '@/lib/services/volunteer.service';
import { UserRole } from '@prisma/client';

/**
 * GET /api/volunteers
 * List all volunteers
 * Admin only
 */
export const GET = withAuth(async (user) => {
  const volunteers = await volunteerService.getAllVolunteers(user);
  return NextResponse.json(volunteers, { status: 200 });
}, UserRole.ADMIN);
