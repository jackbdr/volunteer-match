export function serializeEvent<T extends { zoomMeetingId?: bigint | string | null }>(event: T): Omit<T, 'zoomMeetingId'> & { zoomMeetingId?: string | null } {
  const { zoomMeetingId, ...rest } = event;
  return {
    ...rest,
    zoomMeetingId: typeof zoomMeetingId === 'bigint' ? zoomMeetingId.toString() : zoomMeetingId,
  };
}

export function serializeEvents<T extends { zoomMeetingId?: bigint | string | null }>(events: T[]): Array<Omit<T, 'zoomMeetingId'> & { zoomMeetingId?: string | null }> {
  return events.map(serializeEvent);
}

export function serializeInvitation<T extends { 
  event: { zoomMeetingId?: bigint | string | null };
  [key: string]: unknown;
}>(invitation: T): Omit<T, 'event'> & { 
  event: Omit<T['event'], 'zoomMeetingId'> & { zoomMeetingId?: string | null };
} {
  return {
    ...invitation,
    event: serializeEvent(invitation.event),
  };
}

export function serializeInvitations<T extends { 
  event: { zoomMeetingId?: bigint | string | null };
  [key: string]: unknown;
}>(invitations: T[]): Array<Omit<T, 'event'> & { 
  event: Omit<T['event'], 'zoomMeetingId'> & { zoomMeetingId?: string | null };
}> {
  return invitations.map(serializeInvitation);
}

export function serializeMatch<T extends { 
  event: { zoomMeetingId?: bigint | string | null };
  [key: string]: unknown;
}>(match: T): Omit<T, 'event'> & { 
  event: Omit<T['event'], 'zoomMeetingId'> & { zoomMeetingId?: string | null };
} {
  return {
    ...match,
    event: serializeEvent(match.event),
  };
}

export function serializeMatches<T extends { 
  event: { zoomMeetingId?: bigint | string | null };
  [key: string]: unknown;
}>(matches: T[]): Array<Omit<T, 'event'> & { 
  event: Omit<T['event'], 'zoomMeetingId'> & { zoomMeetingId?: string | null };
}> {
  return matches.map(serializeMatch);
}
