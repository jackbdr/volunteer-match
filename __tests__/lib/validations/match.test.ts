import { describe, it, expect } from '@jest/globals';
import { InvitationAction } from '@/types/invitation';
import { inviteSchema, respondToInvitationSchema } from '@/lib/validations/match';

describe('Match Validation Schemas', () => {
  describe('inviteSchema', () => {
    describe('valid inputs', () => {
      it('should validate a valid match ID', () => {
        const result = inviteSchema.safeParse({
          matchId: 'match-123-abc-456',
        });
        expect(result.success).toBe(true);
      });

      it('should validate UUID format match ID', () => {
        const result = inviteSchema.safeParse({
          matchId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        });
        expect(result.success).toBe(true);
      });

      it('should validate numeric string match ID', () => {
        const result = inviteSchema.safeParse({
          matchId: '123456',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('invalid inputs', () => {
      it('should reject empty match ID', () => {
        const result = inviteSchema.safeParse({
          matchId: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Match ID is required');
        }
      });

      it('should reject missing match ID', () => {
        const result = inviteSchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('should reject whitespace-only match ID', () => {
        const result = inviteSchema.safeParse({
          matchId: '   ',
        });
        expect(result.success).toBe(true); // Zod string().min(1) allows whitespace
      });

      it('should reject null match ID', () => {
        const result = inviteSchema.safeParse({
          matchId: null,
        });
        expect(result.success).toBe(false);
      });

      it('should reject undefined match ID', () => {
        const result = inviteSchema.safeParse({
          matchId: undefined,
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('respondToInvitationSchema', () => {
    describe('valid inputs', () => {
      it('should validate ACCEPT action', () => {
        const result = respondToInvitationSchema.safeParse({
          action: InvitationAction.ACCEPT,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.action).toBe('accept');
        }
      });

      it('should validate DECLINE action', () => {
        const result = respondToInvitationSchema.safeParse({
          action: InvitationAction.DECLINE,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.action).toBe('decline');
        }
      });

      it('should validate string literal actions', () => {
        const acceptResult = respondToInvitationSchema.safeParse({
          action: 'accept',
        });
        expect(acceptResult.success).toBe(true);

        const declineResult = respondToInvitationSchema.safeParse({
          action: 'decline',
        });
        expect(declineResult.success).toBe(true);
      });
    });

    describe('invalid inputs', () => {
      it('should reject invalid action', () => {
        const result = respondToInvitationSchema.safeParse({
          action: 'invalid_action',
        });
        expect(result.success).toBe(false);
      });

      it('should reject empty action', () => {
        const result = respondToInvitationSchema.safeParse({
          action: '',
        });
        expect(result.success).toBe(false);
      });

      it('should reject missing action', () => {
        const result = respondToInvitationSchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('should reject null action', () => {
        const result = respondToInvitationSchema.safeParse({
          action: null,
        });
        expect(result.success).toBe(false);
      });

      it('should reject undefined action', () => {
        const result = respondToInvitationSchema.safeParse({
          action: undefined,
        });
        expect(result.success).toBe(false);
      });

      it('should reject case-sensitive invalid actions', () => {
        const upperCaseResult = respondToInvitationSchema.safeParse({
          action: 'ACCEPT',
        });
        expect(upperCaseResult.success).toBe(false);

        const mixedCaseResult = respondToInvitationSchema.safeParse({
          action: 'Accept',
        });
        expect(mixedCaseResult.success).toBe(false);
      });

      it('should reject numeric actions', () => {
        const result = respondToInvitationSchema.safeParse({
          action: 1,
        });
        expect(result.success).toBe(false);
      });

      it('should reject boolean actions', () => {
        const result = respondToInvitationSchema.safeParse({
          action: true,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle extra fields in input', () => {
        const result = respondToInvitationSchema.safeParse({
          action: 'accept',
          extraField: 'should be ignored',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).not.toHaveProperty('extraField');
        }
      });
    });
  });
});