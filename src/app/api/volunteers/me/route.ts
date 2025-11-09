import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth-handler';
import { volunteerService } from '@/lib/services/volunteer.service';
import { createVolunteerSchema, updateVolunteerSchema } from '@/lib/validations/volunteer';

/**
 * GET /api/volunteers/me
 * Get current user's volunteer profile
 * Authenticated volunteers only
 */
export const GET = withAuth(async (user) => {
  const volunteer = await volunteerService.getCurrentUserProfile(user);
  return NextResponse.json(volunteer, { status: 200 });
});

/**
 * POST /api/volunteers/me
 * Create current user's volunteer profile
 * Authenticated users only
 */
export const POST = withAuth(async (user, request: NextRequest) => {
  const body = await request.json();
  const validatedData = createVolunteerSchema.parse(body);
  const volunteer = await volunteerService.createProfile(user, validatedData);

  return NextResponse.json(volunteer, { status: 201 });
});

/**
 * PATCH /api/volunteers/me
 * Update current user's volunteer profile
 * Authenticated volunteers only
 */
export const PATCH = withAuth(async (user, request: NextRequest) => {
  const body = await request.json();
  const validatedData = updateVolunteerSchema.parse(body);
  const volunteer = await volunteerService.updateProfile(user, validatedData);
  
  return NextResponse.json(volunteer, { status: 200 });
});
