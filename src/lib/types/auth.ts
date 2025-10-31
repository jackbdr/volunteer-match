import { UserRole } from '@prisma/client';

/**
 * Authenticated user type
 * Used throughout the application for user session data
 */
export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
}