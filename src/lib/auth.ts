import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { UserRole } from '@prisma/client';
import { UnauthorizedError, ForbiddenError } from './errors';
import type { AuthUser } from './types/auth';

/**
 * Get the current authenticated user
 * Use this in Server Components and API routes
 */
export async function getCurrentUser(): Promise<AuthUser | undefined> {
  const session = await getServerSession(authOptions);
  return session?.user;
}

/**
 * Require authentication and optionally a specific role
 * Throws error if not authenticated or doesn't have required role
 */
export async function requireAuth(requiredRole?: UserRole): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  if (requiredRole && user.role !== requiredRole) {
    throw new ForbiddenError();
  }

  return user;
}
