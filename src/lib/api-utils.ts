import { NextResponse } from 'next/server';
import { z } from 'zod';
import { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError } from './errors';

/**
 * Centralized API error handler
 * Handles common error types and returns appropriate HTTP responses
 */
export function handleApiError(error: unknown, defaultMessage: string): NextResponse {
  if (error instanceof NotFoundError) {
    return NextResponse.json(
      { error: error.message },
      { status: 404 }
    );
  }

  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      { error: error.message },
      { status: 403 }
    );
  }

  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Invalid input', details: error.issues },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { error: defaultMessage },
    { status: 500 }
  );
}
