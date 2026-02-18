import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Replicate the schema from route.ts for isolated testing
const RegisterSchema = z.object({
  idempotencyKey: z.string().uuid('Invalid idempotency key').optional(),
  track: z.enum([
    'IdeaSprint: Build MVP in 24 Hours',
    'BuildStorm: Solve Problem Statement in 24 Hours',
    'IDEA_SPRINT',
    'BUILD_STORM',
  ]),
  teamName: z.string().min(2, 'Team name must be at least 2 characters').max(100),
  teamSize: z.string(),
  leaderName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  leaderEmail: z.string().email('Invalid email format'),
  leaderMobile: z.string().regex(/^[0-9]{10}$/, 'Mobile number must be 10 digits'),
  leaderCollege: z.string().min(2).max(200),
  leaderDegree: z.string().min(2).max(100),
  member2Name: z.string().optional(),
  member2Email: z.string().email().optional().or(z.literal('')),
  member2College: z.string().optional(),
  member2Degree: z.string().optional(),
  member3Name: z.string().optional(),
  member3Email: z.string().email().optional().or(z.literal('')),
  member3College: z.string().optional(),
  member3Degree: z.string().optional(),
  member4Name: z.string().optional(),
  member4Email: z.string().email().optional().or(z.literal('')),
  member4College: z.string().optional(),
  member4Degree: z.string().optional(),
  ideaTitle: z.string().optional(),
  problemStatement: z.string().optional(),
  proposedSolution: z.string().optional(),
  targetUsers: z.string().optional(),
  expectedImpact: z.string().optional(),
  techStack: z.string().optional(),
  docLink: z.string().url().optional().or(z.literal('')),
  problemDesc: z.string().optional(),
  githubLink: z.string().url().optional().or(z.literal('')),
  hearAbout: z.string().optional(),
  additionalNotes: z.string().optional(),
});

describe('Registration Schema Validation', () => {
  const validPayload = {
    track: 'IDEA_SPRINT' as const,
    teamName: 'Test Team',
    teamSize: '3',
    leaderName: 'John Doe',
    leaderEmail: 'john@example.com',
    leaderMobile: '9876543210',
    leaderCollege: 'Test University',
    leaderDegree: 'B.Tech',
  };

  describe('valid inputs', () => {
    it('should accept a valid minimal registration', () => {
      const result = RegisterSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should accept IDEA_SPRINT track', () => {
      const result = RegisterSchema.safeParse({ ...validPayload, track: 'IDEA_SPRINT' });
      expect(result.success).toBe(true);
    });

    it('should accept BUILD_STORM track', () => {
      const result = RegisterSchema.safeParse({ ...validPayload, track: 'BUILD_STORM' });
      expect(result.success).toBe(true);
    });

    it('should accept full-text track names', () => {
      const result = RegisterSchema.safeParse({
        ...validPayload,
        track: 'IdeaSprint: Build MVP in 24 Hours',
      });
      expect(result.success).toBe(true);
    });

    it('should accept registration with all members', () => {
      const result = RegisterSchema.safeParse({
        ...validPayload,
        member2Name: 'Jane Doe',
        member2Email: 'jane@example.com',
        member2College: 'University B',
        member2Degree: 'B.Sc',
        member3Name: 'Bob Smith',
        member3Email: 'bob@example.com',
        member3College: 'University C',
        member3Degree: 'M.Tech',
      });
      expect(result.success).toBe(true);
    });

    it('should accept optional idempotency key (UUID)', () => {
      const result = RegisterSchema.safeParse({
        ...validPayload,
        idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty strings for optional email/url fields', () => {
      const result = RegisterSchema.safeParse({
        ...validPayload,
        member2Email: '',
        docLink: '',
        githubLink: '',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('should reject missing required fields', () => {
      const result = RegisterSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject invalid track', () => {
      const result = RegisterSchema.safeParse({ ...validPayload, track: 'INVALID_TRACK' });
      expect(result.success).toBe(false);
    });

    it('should reject short team name', () => {
      const result = RegisterSchema.safeParse({ ...validPayload, teamName: 'A' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const result = RegisterSchema.safeParse({ ...validPayload, leaderEmail: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid mobile number', () => {
      const result = RegisterSchema.safeParse({ ...validPayload, leaderMobile: '123' });
      expect(result.success).toBe(false);
    });

    it('should reject mobile with letters', () => {
      const result = RegisterSchema.safeParse({ ...validPayload, leaderMobile: '98765abcde' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid idempotency key format', () => {
      const result = RegisterSchema.safeParse({
        ...validPayload,
        idempotencyKey: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid member email', () => {
      const result = RegisterSchema.safeParse({
        ...validPayload,
        member2Email: 'bad-email',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid URL for docLink', () => {
      const result = RegisterSchema.safeParse({
        ...validPayload,
        docLink: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('should reject leader name that is too short', () => {
      const result = RegisterSchema.safeParse({ ...validPayload, leaderName: 'J' });
      expect(result.success).toBe(false);
    });
  });
});
