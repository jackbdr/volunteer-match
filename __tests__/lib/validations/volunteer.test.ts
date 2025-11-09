import { describe, it, expect } from '@jest/globals';
import { createVolunteerSchema, updateVolunteerSchema } from '@/lib/validations/volunteer';

describe('Volunteer Validation Schemas', () => {
  describe('createVolunteerSchema', () => {
    const validVolunteerData = {
      skills: ['JavaScript', 'React', 'Node.js'],
      availability: ['Monday', 'Wednesday', 'Friday'],
      location: 'New York',
      preferredCauses: ['Education', 'Environment'],
    };

    describe('valid inputs', () => {
      it('should validate complete valid volunteer data', () => {
        const result = createVolunteerSchema.safeParse(validVolunteerData);
        expect(result.success).toBe(true);
      });

      it('should validate with optional bio', () => {
        const volunteerWithBio = {
          ...validVolunteerData,
          bio: 'I am a passionate developer who loves to help others learn programming.',
        };
        
        const result = createVolunteerSchema.safeParse(volunteerWithBio);
        expect(result.success).toBe(true);
      });

      it('should validate with empty bio', () => {
        const volunteerWithEmptyBio = {
          ...validVolunteerData,
          bio: '',
        };
        
        const result = createVolunteerSchema.safeParse(volunteerWithEmptyBio);
        expect(result.success).toBe(true);
      });

      it('should validate with single skill', () => {
        const result = createVolunteerSchema.safeParse({
          ...validVolunteerData,
          skills: ['JavaScript'],
        });
        expect(result.success).toBe(true);
      });

      it('should validate with single availability slot', () => {
        const result = createVolunteerSchema.safeParse({
          ...validVolunteerData,
          availability: ['Monday'],
        });
        expect(result.success).toBe(true);
      });

      it('should validate with single preferred cause', () => {
        const result = createVolunteerSchema.safeParse({
          ...validVolunteerData,
          preferredCauses: ['Education'],
        });
        expect(result.success).toBe(true);
      });

      it('should validate with minimum location length', () => {
        const result = createVolunteerSchema.safeParse({
          ...validVolunteerData,
          location: 'NY',
        });
        expect(result.success).toBe(true);
      });

      it('should validate with maximum bio length', () => {
        const result = createVolunteerSchema.safeParse({
          ...validVolunteerData,
          bio: 'A'.repeat(500),
        });
        expect(result.success).toBe(true);
      });
    });

    describe('invalid inputs', () => {
      it('should reject empty skills array', () => {
        const result = createVolunteerSchema.safeParse({
          ...validVolunteerData,
          skills: [],
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('At least one skill is required');
        }
      });

      it('should reject empty availability array', () => {
        const result = createVolunteerSchema.safeParse({
          ...validVolunteerData,
          availability: [],
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('At least one time slot is required');
        }
      });

      it('should reject empty preferredCauses array', () => {
        const result = createVolunteerSchema.safeParse({
          ...validVolunteerData,
          preferredCauses: [],
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('At least one cause is required');
        }
      });

      it('should reject location too short', () => {
        const result = createVolunteerSchema.safeParse({
          ...validVolunteerData,
          location: 'A',
        });
        expect(result.success).toBe(false);
      });

      it('should reject bio too long', () => {
        const result = createVolunteerSchema.safeParse({
          ...validVolunteerData,
          bio: 'A'.repeat(501),
        });
        expect(result.success).toBe(false);
      });

      it('should reject missing required fields', () => {
        const result = createVolunteerSchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('should reject when skills is not an array', () => {
        const result = createVolunteerSchema.safeParse({
          ...validVolunteerData,
          skills: 'JavaScript',
        });
        expect(result.success).toBe(false);
      });

      it('should reject when availability is not an array', () => {
        const result = createVolunteerSchema.safeParse({
          ...validVolunteerData,
          availability: 'Monday',
        });
        expect(result.success).toBe(false);
      });

      it('should reject when preferredCauses is not an array', () => {
        const result = createVolunteerSchema.safeParse({
          ...validVolunteerData,
          preferredCauses: 'Education',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle arrays with duplicate values', () => {
        const result = createVolunteerSchema.safeParse({
          ...validVolunteerData,
          skills: ['JavaScript', 'JavaScript', 'React'],
        });
        expect(result.success).toBe(true);
      });

      it('should handle empty strings in arrays', () => {
        const result = createVolunteerSchema.safeParse({
          ...validVolunteerData,
          skills: ['JavaScript', '', 'React'],
        });
        expect(result.success).toBe(true);
      });

      it('should handle whitespace-only location', () => {
        const result = createVolunteerSchema.safeParse({
          ...validVolunteerData,
          location: ' ',
        });
        expect(result.success).toBe(false);
      });

      it('should handle null values for optional fields', () => {
        const result = createVolunteerSchema.safeParse({
          ...validVolunteerData,
          bio: null,
        });
        expect(result.success).toBe(false); // bio should be string or undefined
      });
    });
  });

  describe('updateVolunteerSchema', () => {
    describe('valid inputs', () => {
      it('should validate partial updates', () => {
        const result = updateVolunteerSchema.safeParse({
          skills: ['Python', 'Django'],
        });
        expect(result.success).toBe(true);
      });

      it('should validate empty update', () => {
        const result = updateVolunteerSchema.safeParse({});
        expect(result.success).toBe(true);
      });

      it('should validate single field update', () => {
        const result = updateVolunteerSchema.safeParse({
          location: 'San Francisco',
        });
        expect(result.success).toBe(true);
      });

      it('should validate multiple field updates', () => {
        const result = updateVolunteerSchema.safeParse({
          skills: ['Vue.js', 'TypeScript'],
          availability: ['Tuesday', 'Thursday'],
          bio: 'Updated bio information',
        });
        expect(result.success).toBe(true);
      });

      it('should validate removing optional fields', () => {
        const result = updateVolunteerSchema.safeParse({
          bio: undefined,
        });
        expect(result.success).toBe(true);
      });
    });

    describe('invalid inputs', () => {
      it('should apply same validation rules to provided fields', () => {
        const result = updateVolunteerSchema.safeParse({
          skills: [], // empty array not allowed
        });
        expect(result.success).toBe(false);
      });

      it('should reject invalid location length', () => {
        const result = updateVolunteerSchema.safeParse({
          location: 'A', // too short
        });
        expect(result.success).toBe(false);
      });

      it('should reject bio too long', () => {
        const result = updateVolunteerSchema.safeParse({
          bio: 'A'.repeat(501),
        });
        expect(result.success).toBe(false);
      });

      it('should reject empty availability when provided', () => {
        const result = updateVolunteerSchema.safeParse({
          availability: [],
        });
        expect(result.success).toBe(false);
      });

      it('should reject empty preferredCauses when provided', () => {
        const result = updateVolunteerSchema.safeParse({
          preferredCauses: [],
        });
        expect(result.success).toBe(false);
      });
    });

    describe('partial update scenarios', () => {
      it('should handle updating only bio', () => {
        const result = updateVolunteerSchema.safeParse({
          bio: 'New updated biography',
        });
        expect(result.success).toBe(true);
      });

      it('should handle clearing bio', () => {
        const result = updateVolunteerSchema.safeParse({
          bio: '',
        });
        expect(result.success).toBe(true);
      });

      it('should handle updating arrays independently', () => {
        const skillsUpdate = updateVolunteerSchema.safeParse({
          skills: ['New Skill'],
        });
        expect(skillsUpdate.success).toBe(true);

        const availabilityUpdate = updateVolunteerSchema.safeParse({
          availability: ['Sunday'],
        });
        expect(availabilityUpdate.success).toBe(true);

        const causesUpdate = updateVolunteerSchema.safeParse({
          preferredCauses: ['Health'],
        });
        expect(causesUpdate.success).toBe(true);
      });
    });
  });
});