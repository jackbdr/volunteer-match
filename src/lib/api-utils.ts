import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Centralized API error handler
 * Handles common error types and returns appropriate HTTP responses
 */
export function handleApiError(error: unknown, defaultMessage: string): NextResponse {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Invalid input', details: error.issues },
      { status: 400 }
    );
  }

  if (error instanceof Error && error.message === 'Unauthorized') {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  if (error instanceof Error && error.message.includes('Forbidden')) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  if (error instanceof Error && error.message.includes('Record to update not found')) {
    return NextResponse.json(
      { error: 'Resource not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { error: defaultMessage },
    { status: 500 }
  );
}
