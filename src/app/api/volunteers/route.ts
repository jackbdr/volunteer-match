import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { handleApiError } from '@/lib/api-utils';

/**
 * GET /api/volunteers
 * List all volunteers
 * Admin only
 */
export async function GET(): Promise<NextResponse> {
  try {
    await requireAuth(UserRole.ADMIN);

    const volunteers = await prisma.volunteer.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: { matches: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(volunteers);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch volunteers');
  }
}
