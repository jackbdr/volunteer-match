/**
 * Test utilities and helpers
 */

import { EventType, EventStatus, MatchStatus, Event as PrismaEvent, EventMatch as PrismaEventMatch } from '@prisma/client';
import type { VolunteerWithRelations } from '@/lib/repositories/volunteer.repository';

export const createMockEvent = (overrides = {}): PrismaEvent => ({
  id: 'event-1',
  title: 'Test Event',
  description: 'Test event description',
  eventType: EventType.VIRTUAL,
  status: EventStatus.PUBLISHED,
  requiredSkills: ['JavaScript', 'React'],
  location: 'Virtual',
  timeSlot: '2024-12-01T10:00:00Z',
  startTime: new Date('2024-12-01T10:00:00Z'),
  duration: 60,
  meetingUrl: 'https://example.com/meeting',
  zoomMeetingId: BigInt(123456789),
  registrationDeadline: new Date('2024-11-30T23:59:59Z'),
  maxVolunteers: 10,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockVolunteer = (overrides = {}): VolunteerWithRelations => ({
  id: 'volunteer-1',
  userId: 'user-1',
  skills: ['JavaScript', 'React', 'Node.js'],
  availability: ['Monday', 'Wednesday', 'Friday'],
  location: 'New York',
  preferredCauses: [],
  bio: 'Experienced developer',
  createdAt: new Date(),
  updatedAt: new Date(),
  user: {
    id: 'user-1',
    name: 'John Doe',
    email: 'volunteer@example.com',
  },
  matches: [],
  ...overrides,
});

export const createMockEventMatch = (overrides = {}): PrismaEventMatch => ({
  id: 'match-1',
  eventId: 'event-1',
  volunteerId: 'volunteer-1',
  score: 85,
  status: MatchStatus.PENDING,
  notified: false,
  emailSentAt: null,
  matchedAt: new Date(),
  ...overrides,
});

// Helper to reset all mocks
export const resetAllMocks = (): void => {
  jest.clearAllMocks();
};

// Async test helpers
export const waitFor = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export const flushPromises = (): Promise<void> => new Promise(setImmediate);