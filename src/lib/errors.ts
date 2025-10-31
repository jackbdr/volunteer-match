/**
 * Custom error classes for API endpoints
 * Provides type-safe, structured error handling
 */

export class NotFoundError extends Error {
  public constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  public constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  public constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends Error {
  public constructor(message: string = 'Invalid input') {
    super(message);
    this.name = 'ValidationError';
  }
}
