// REST Registration Endpoint
//
// Part of the PUBLIC registration flow (REST-based, OTP auth):
//   /api/send-otp   → Generate & email OTP
//   /api/verify-otp → Verify OTP, create session
//   /api/register   → Create team + submission (this file)
//
// The ADMIN panel uses tRPC (/api/trpc/*) instead — see server/trpc.ts.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimitByIP, createRateLimitHeaders } from '@/lib/rate-limit';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

// Comprehensive input validation schema
const RegisterSchema = z.object({
  // Idempotency key
  idempotencyKey: z.string().uuid('Invalid idempotency key').optional(),
  
  // Team Info
  track: z.enum(['IdeaSprint: Build MVP in 24 Hours', 'BuildStorm: Solve Problem Statement in 24 Hours', 'IDEA_SPRINT', 'BUILD_STORM']),
  teamName: z.string().min(2, 'Team name must be at least 2 characters').max(100),
  teamSize: z.string(),
  
  // Leader Info
  leaderName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  leaderEmail: z.string().email('Invalid email format'),
  leaderMobile: z.string().regex(/^[0-9]{10}$/, 'Mobile number must be 10 digits'),
  leaderCollege: z.string().min(2).max(200),
  leaderDegree: z.string().min(2).max(100),
  
  // Members (optional)
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
  
  // IdeaSprint Fields
  ideaTitle: z.string().optional(),
  problemStatement: z.string().optional(),
  proposedSolution: z.string().optional(),
  targetUsers: z.string().optional(),
  expectedImpact: z.string().optional(),
  techStack: z.string().optional(),
  docLink: z.string().url().optional().or(z.literal('')),
  
  // BuildStorm Fields
  problemDesc: z.string().optional(),
  githubLink: z.string().url().optional().or(z.literal('')),
  
  // Meta
  hearAbout: z.string().optional(),
  additionalNotes: z.string().optional(),
});

// Idempotency store (use Redis in production)
interface IdempotencyResponse {
  success: boolean;
  message: string;
  data: {
    teamId: string;
    submissionId: string;
    teamName: string;
    track: 'IDEA_SPRINT' | 'BUILD_STORM';
  };
}

const idempotencyStore = new Map<string, { response: IdempotencyResponse; timestamp: number }>();

function checkIdempotency(key: string): IdempotencyResponse | null {
  const record = idempotencyStore.get(key);
  if (!record) return null;
  
  // Expire after 24 hours
  if (Date.now() - record.timestamp > 24 * 60 * 60 * 1000) {
    idempotencyStore.delete(key);
    return null;
  }
  
  return record.response;
}

function storeIdempotency(key: string, response: IdempotencyResponse) {
  idempotencyStore.set(key, {
    response,
    timestamp: Date.now(),
  });
}

export async function POST(req: Request) {
  try {
    // ✅ FIXED: IP-based rate limiting on register endpoint
    // 5 registrations per hour per IP (prevents spam registrations)
    const rateLimit = await rateLimitByIP(req, 5, 3600);

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many registration attempts. Please wait before trying again.',
          retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
        },
        { 
          status: 429,
          headers: createRateLimitHeaders(rateLimit),
        }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const validation = RegisterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: validation.error.errors[0].message,
          details: validation.error.errors,
        },
        { 
          status: 400,
          headers: createRateLimitHeaders(rateLimit),
        }
      );
    }

    const data = validation.data;

    // Check idempotency
    if (data.idempotencyKey) {
      const cachedResponse = checkIdempotency(data.idempotencyKey);
      if (cachedResponse) {
        console.log(`[Register] Returning cached response for idempotency key: ${data.idempotencyKey}`);
        return NextResponse.json(cachedResponse);
      }
    }

    // Verify OTP was verified
    const otpRecord = await prisma.otp.findUnique({
      where: {
        email_purpose: {
          email: data.leaderEmail,
          purpose: 'REGISTRATION',
        },
      },
    });

    if (!otpRecord || !otpRecord.verified) {
      return NextResponse.json(
        {
          success: false,
          error: 'EMAIL_NOT_VERIFIED',
          message: 'Email not verified. Please verify OTP first.',
        },
        { status: 403 }
      );
    }

    // Map track names to enum values
    const trackMap: Record<string, 'IDEA_SPRINT' | 'BUILD_STORM'> = {
      'IdeaSprint: Build MVP in 24 Hours': 'IDEA_SPRINT',
      'BuildStorm: Solve Problem Statement in 24 Hours': 'BUILD_STORM',
      'IDEA_SPRINT': 'IDEA_SPRINT',
      'BUILD_STORM': 'BUILD_STORM',
    };

    const trackEnum = trackMap[data.track];
    if (!trackEnum) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_TRACK',
          message: 'Invalid track selection',
        },
        { status: 400 }
      );
    }

    // Collect all members
    const members: Array<{
      email: string;
      name: string;
      college: string;
      degree: string;
      phone: string;
      role: 'LEADER' | 'MEMBER';
    }> = [
      {
        email: data.leaderEmail,
        name: data.leaderName,
        college: data.leaderCollege,
        degree: data.leaderDegree,
        phone: data.leaderMobile,
        role: 'LEADER' as const,
      },
    ];

    if (data.member2Email && data.member2Name) {
      members.push({
        email: data.member2Email,
        name: data.member2Name,
        college: data.member2College || data.leaderCollege,
        degree: data.member2Degree || '',
        phone: '',
        role: 'MEMBER' as const,
      });
    }
    if (data.member3Email && data.member3Name) {
      members.push({
        email: data.member3Email,
        name: data.member3Name,
        college: data.member3College || data.leaderCollege,
        degree: data.member3Degree || '',
        phone: '',
        role: 'MEMBER' as const,
      });
    }
    if (data.member4Email && data.member4Name) {
      members.push({
        email: data.member4Email,
        name: data.member4Name,
        college: data.member4College || data.leaderCollege,
        degree: data.member4Degree || '',
        phone: '',
        role: 'MEMBER' as const,
      });
    }

    // Create team with all related data in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Check if leader already has a team in this track (inside transaction)
      const existingTeam = await tx.team.findFirst({
        where: {
          track: trackEnum,
          members: {
            some: {
              user: {
                email: data.leaderEmail,
              },
              role: 'LEADER',
            },
          },
        },
      });

      if (existingTeam) {
        throw new Error(`DUPLICATE_REGISTRATION:You have already registered for ${trackEnum === 'IDEA_SPRINT' ? 'IdeaSprint' : 'BuildStorm'}`);
      }

      // 1. Create or find users for all members
      const userIds: { userId: string; role: 'LEADER' | 'MEMBER' }[] = [];

      for (const member of members) {
        // Find existing user first
        const existingUser = await tx.user.findUnique({
          where: { email: member.email },
        });

        let user;
        if (existingUser) {
          // Update existing user
          user = await tx.user.update({
            where: { email: member.email },
            data: {
              name: member.name || existingUser.name,
              college: member.college || existingUser.college,
              degree: member.degree || existingUser.degree,
              phone: member.phone || existingUser.phone,
            },
          });
        } else {
          // Create new user
          user = await tx.user.create({
            data: {
              email: member.email,
              name: member.name || '',
              college: member.college,
              degree: member.degree,
              phone: member.phone,
              emailVerified: member.email === data.leaderEmail, // Leader is verified
              role: 'PARTICIPANT',
            },
          });
        }

        userIds.push({ userId: user.id, role: member.role });
      }

      // 2. Create team
      const team = await tx.team.create({
        data: {
          name: data.teamName,
          track: trackEnum,
          status: 'PENDING',
          size: members.length,
          college: data.leaderCollege,
          hearAbout: data.hearAbout,
          additionalNotes: data.additionalNotes,
          createdBy: userIds[0].userId, // Leader's user ID
        },
      });

      // 3. Create team members
      for (const { userId, role } of userIds) {
        await tx.teamMember.create({
          data: {
            userId,
            teamId: team.id,
            role,
          },
        });
      }

      // 4. Create submission
      const submission = await tx.submission.create({
        data: {
          teamId: team.id,
          // IdeaSprint fields
          ideaTitle: trackEnum === 'IDEA_SPRINT' ? data.ideaTitle : null,
          problemStatement: trackEnum === 'IDEA_SPRINT' ? data.problemStatement : null,
          proposedSolution: trackEnum === 'IDEA_SPRINT' ? data.proposedSolution : null,
          targetUsers: trackEnum === 'IDEA_SPRINT' ? data.targetUsers : null,
          expectedImpact: trackEnum === 'IDEA_SPRINT' ? data.expectedImpact : null,
          techStack: trackEnum === 'IDEA_SPRINT' ? data.techStack : null,
          // BuildStorm fields
          problemDesc: trackEnum === 'BUILD_STORM' ? data.problemDesc : null,
          githubLink: trackEnum === 'BUILD_STORM' ? data.githubLink : null,
        },
      });

      // 5. Create activity log
      await tx.activityLog.create({
        data: {
          userId: userIds[0].userId,
          action: 'team.created',
          entity: 'Team',
          entityId: team.id,
          metadata: {
            teamName: data.teamName,
            track: trackEnum,
            memberCount: members.length,
          },
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
        },
      });

      return { team, submission };
    });

    const response = {
      success: true,
      message: 'Registration successful!',
      data: {
        teamId: result.team.id,
        submissionId: result.submission.id,
        teamName: result.team.name,
        track: result.team.track,
      },
    };

    // Store idempotency response
    if (data.idempotencyKey) {
      storeIdempotency(data.idempotencyKey, response);
    }

    return NextResponse.json(response, {
      headers: createRateLimitHeaders(rateLimit),
    });
  } catch (error) {
    console.error('[Register] Error:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.startsWith('DUPLICATE_REGISTRATION:')) {
        const message = error.message.split(':')[1];
        return NextResponse.json(
          {
            success: false,
            error: 'DUPLICATE_REGISTRATION',
            message,
          },
          { status: 409 }
        );
      }

      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          {
            success: false,
            error: 'DUPLICATE_ENTRY',
            message: 'A team member is already registered in another team for this track',
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
