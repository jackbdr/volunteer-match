import { NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { getCurrentUser, requireAuth } from '@/lib/auth';
import { withErrorHandler } from './error-handler';
import type { AuthUser } from '@/types/auth';

/**
 * Wraps API route handlers with authentication
 * Handles auth and passes user context to the handler
 */
export function withAuth<T extends unknown[]>(
  handler: (user: AuthUser, ...args: T) => Promise<NextResponse>,
  requiredRole?: UserRole
): (...args: T) => Promise<NextResponse> {
  return withErrorHandler(async (...args: T) => {
    const user = await requireAuth(requiredRole);
    return handler(user, ...args);
  });
}

/**
 * Wraps API route handlers with optional authentication
 * Passes user context (or undefined) to the handler
 */
export function withOptionalAuth<T extends unknown[]>(
  handler: (user: AuthUser | undefined, ...args: T) => Promise<NextResponse>
): (...args: T) => Promise<NextResponse> {
  return withErrorHandler(async (...args: T) => {
    const user = await getCurrentUser();
    return handler(user, ...args);
  });
}
