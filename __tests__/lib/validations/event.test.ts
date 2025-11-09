import { describe, it, expect } from '@jest/globals';
import { EventType, EventStatus } from '@prisma/client';
import { createEventSchema, updateEventSchema } from '@/lib/validations/event';

describe('Event Validation Schemas', () => {
  describe('createEventSchema', () => {
    const validEventData = {
      title: 'Test Event',
      description: 'This is a test event description that meets the minimum length requirement',
      eventType: EventType.VIRTUAL,
      requiredSkills: ['JavaScript', 'React'],
      location: 'Virtual Meeting Room',
      timeSlot: '2024-12-01T10:00:00Z',
      startTime: '2024-12-01T10:00:00Z',
      duration: 120,
    };

    describe('valid inputs', () => {
      it('should validate a complete valid event', () => {
        const result = createEventSchema.safeParse(validEventData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe(EventStatus.DRAFT); // default value
        }
      });

      it('should validate with optional fields', () => {
        const eventWithOptionals = {
          ...validEventData,
          status: EventStatus.PUBLISHED,
          meetingUrl: 'https://zoom.us/j/123456789',
          zoomMeetingId: '123456789',
          registrationDeadline: '2024-11-30T23:59:59Z',
          maxVolunteers: 10,
        };
        
        const result = createEventSchema.safeParse(eventWithOptionals);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.zoomMeetingId).toBe(BigInt(123456789));
        }
      });

      it('should handle BigInt zoomMeetingId', () => {
        const eventWithBigInt = {
          ...validEventData,
          zoomMeetingId: BigInt(987654321),
        };
        
        const result = createEventSchema.safeParse(eventWithBigInt);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.zoomMeetingId).toBe(BigInt(987654321));
        }
      });

      it('should validate minimum duration', () => {
        const result = createEventSchema.safeParse({
          ...validEventData,
          duration: 30,
        });
        expect(result.success).toBe(true);
      });

      it('should validate maximum duration', () => {
        const result = createEventSchema.safeParse({
          ...validEventData,
          duration: 480,
        });
        expect(result.success).toBe(true);
      });
    });

    describe('invalid inputs', () => {
      it('should reject short title', () => {
        const result = createEventSchema.safeParse({
          ...validEventData,
          title: 'Hi',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('at least 3 characters');
        }
      });

      it('should reject long title', () => {
        const result = createEventSchema.safeParse({
          ...validEventData,
          title: 'A'.repeat(101),
        });
        expect(result.success).toBe(false);
      });

      it('should reject short description', () => {
        const result = createEventSchema.safeParse({
          ...validEventData,
          description: 'Too short',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('at least 10 characters');
        }
      });

      it('should reject long description', () => {
        const result = createEventSchema.safeParse({
          ...validEventData,
          description: 'A'.repeat(1001),
        });
        expect(result.success).toBe(false);
      });

      it('should reject invalid event type', () => {
        const result = createEventSchema.safeParse({
          ...validEventData,
          eventType: 'INVALID_TYPE',
        });
        expect(result.success).toBe(false);
      });

      it('should reject empty required skills', () => {
        const result = createEventSchema.safeParse({
          ...validEventData,
          requiredSkills: [],
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('At least one skill is required');
        }
      });

      it('should reject short location', () => {
        const result = createEventSchema.safeParse({
          ...validEventData,
          location: 'A',
        });
        expect(result.success).toBe(false);
      });

      it('should reject duration too short', () => {
        const result = createEventSchema.safeParse({
          ...validEventData,
          duration: 29,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('at least 30 minutes');
        }
      });

      it('should reject duration too long', () => {
        const result = createEventSchema.safeParse({
          ...validEventData,
          duration: 481,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('cannot exceed 8 hours');
        }
      });

      it('should reject invalid meeting URL', () => {
        const result = createEventSchema.safeParse({
          ...validEventData,
          meetingUrl: 'not-a-url',
        });
        expect(result.success).toBe(false);
      });

      it('should reject invalid ISO datetime for startTime', () => {
        const result = createEventSchema.safeParse({
          ...validEventData,
          startTime: 'invalid-date',
        });
        expect(result.success).toBe(false);
      });

      it('should reject invalid ISO datetime for registrationDeadline', () => {
        const result = createEventSchema.safeParse({
          ...validEventData,
          registrationDeadline: 'invalid-date',
        });
        expect(result.success).toBe(false);
      });

      it('should reject maxVolunteers less than 1', () => {
        const result = createEventSchema.safeParse({
          ...validEventData,
          maxVolunteers: 0,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle null zoomMeetingId', () => {
        const result = createEventSchema.safeParse({
          ...validEventData,
          zoomMeetingId: null,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.zoomMeetingId).toBe(null);
        }
      });

      it('should handle undefined optional fields', () => {
        const result = createEventSchema.safeParse(validEventData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.meetingUrl).toBeUndefined();
          expect(result.data.registrationDeadline).toBeUndefined();
          expect(result.data.maxVolunteers).toBeUndefined();
        }
      });
    });
  });

  describe('updateEventSchema', () => {
    it('should validate partial updates', () => {
      const result = updateEventSchema.safeParse({
        title: 'Updated Title',
      });
      expect(result.success).toBe(true);
    });

    it('should validate empty update', () => {
      const result = updateEventSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should apply same validation rules to provided fields', () => {
      const result = updateEventSchema.safeParse({
        title: 'Hi', // too short
      });
      expect(result.success).toBe(false);
    });

    it('should validate multiple partial fields', () => {
      const result = updateEventSchema.safeParse({
        title: 'Updated Event Title',
        duration: 90,
        maxVolunteers: 15,
      });
      expect(result.success).toBe(true);
    });
  });
});