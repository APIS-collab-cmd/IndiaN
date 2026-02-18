import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimitByIP, createRateLimitHeaders } from '@/lib/rate-limit';
import crypto from 'crypto';
import { z } from 'zod';

// Input validation schema
const VerifyOtpSchema = z.object({
  email: z.string().email('Invalid email format'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
  purpose: z.enum(['REGISTRATION', 'LOGIN', 'PASSWORD_RESET', 'EMAIL_VERIFICATION']).default('REGISTRATION'),
});

export async function POST(req: Request) {
  try {
    // ✅ FIXED: IP-based rate limiting on verify endpoint
    // 20 requests per minute per IP (prevents brute force from single IP)
    const rateLimit = await rateLimitByIP(req, 20, 60);

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many verification attempts. Please wait before trying again.',
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
    const validation = VerifyOtpSchema.safeParse(body);

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

    const { email, otp, purpose } = validation.data;

    // Hash the provided OTP to compare with stored hash
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Find the OTP record
    const record = await prisma.otp.findUnique({
      where: {
        email_purpose: {
          email,
          purpose: purpose as any,
        },
      },
    });

    if (!record) {
      return NextResponse.json(
        {
          success: false,
          error: 'OTP_NOT_FOUND',
          message: 'Invalid or expired OTP',
        },
        { 
          status: 400,
          headers: createRateLimitHeaders(rateLimit),
        }
      );
    }

    // Check if OTP has expired
    if (new Date() > record.expiresAt) {
      // Clean up expired OTP
      await prisma.otp.delete({
        where: {
          email_purpose: {
            email,
            purpose: purpose as any,
          },
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'OTP_EXPIRED',
          message: 'OTP has expired. Please request a new one.',
        },
        { 
          status: 400,
          headers: createRateLimitHeaders(rateLimit),
        }
      );
    }

    // Check if OTP matches (compare hashes)
    if (record.otp !== otpHash) {
      // Increment attempts
      const newAttempts = record.attempts + 1;

      if (newAttempts >= 5) {
        // Delete OTP after 5 failed attempts
        await prisma.otp.delete({
          where: {
            email_purpose: {
              email,
              purpose: purpose as any,
            },
          },
        });

        return NextResponse.json(
          {
            success: false,
            error: 'TOO_MANY_ATTEMPTS',
            message: 'Too many failed attempts. Please request a new OTP.',
          },
          { 
            status: 429,
            headers: createRateLimitHeaders(rateLimit),
          }
        );
      }

      // Update attempts
      await prisma.otp.update({
        where: {
          email_purpose: {
            email,
            purpose: purpose as any,
          },
        },
        data: {
          attempts: newAttempts,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_OTP',
          message: 'Invalid OTP',
          attemptsRemaining: 5 - newAttempts,
        },
        { 
          status: 400,
          headers: createRateLimitHeaders(rateLimit),
        }
      );
    }

    // OTP is valid - mark as verified
    await prisma.otp.update({
      where: {
        email_purpose: {
          email,
          purpose: purpose as any,
        },
      },
      data: {
        verified: true,
        verifiedAt: new Date(),
      },
    });

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: '', // Will be filled during registration
          emailVerified: true,
          role: 'PARTICIPANT',
        },
      });
    } else {
      // Update email verification status
      await prisma.user.update({
        where: { email },
        data: { emailVerified: true },
      });
    }

    // Create session token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'OTP verified successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          session: {
            token: session.token,
            expiresAt: session.expiresAt,
          },
        },
      },
      {
        headers: createRateLimitHeaders(rateLimit),
      }
    );
  } catch (error) {
    console.error('[OTP Verify] Error:', error);

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
