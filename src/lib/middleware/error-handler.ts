import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-utils';

/**
 * Higher-order function that wraps API route handlers with error handling
 * Reduces boilerplate try/catch blocks in route handlers
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
): (...args: T) => Promise<NextResponse> {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, 'An unexpected error occurred');
    }
  };
}