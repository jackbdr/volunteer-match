import { EventType } from '@prisma/client';

export interface EventFilters {
  type?: EventType;
  location?: string;
  status?: string;
}

/**
 * Parse event filtering parameters from URL search params
 */
export function parseEventFilters(searchParams: URLSearchParams): EventFilters {
  const typeParam = searchParams.get('type');
  const type = typeParam === 'VIRTUAL' || typeParam === 'PHYSICAL' 
    ? typeParam as EventType 
    : undefined;

  const location = searchParams.get('location') || undefined;
  
  const status = searchParams.get('status') || undefined;

  return { type, location, status };
}