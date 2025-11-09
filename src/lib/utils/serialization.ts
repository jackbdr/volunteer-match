export function serializeEvent<T extends { zoomMeetingId?: bigint | string | null }>(event: T) {
  const { zoomMeetingId, ...rest } = event;
  return {
    ...rest,
    zoomMeetingId: typeof zoomMeetingId === 'bigint' ? zoomMeetingId.toString() : zoomMeetingId,
  };
}

export function serializeEvents<T extends { zoomMeetingId?: bigint | string | null }>(events: T[]) {
  return events.map(serializeEvent);
}
