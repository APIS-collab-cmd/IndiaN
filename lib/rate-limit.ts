// Rate Limiting with Redis (Upstash)
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    })
  : null;

// In-memory fallback for development (single instance only)
const memoryStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit using Redis (production) or in-memory (development)
 * 
 * @param identifier - Unique identifier (email, IP, etc.)
 * @param limit - Maximum number of requests
 * @param windowSeconds - Time window in seconds
 * @returns Rate limit result
 */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const resetTime = now + windowSeconds * 1000;

  // Use Redis if available (production)
  if (redis) {
    try {
      // Increment counter
      const count = await redis.incr(key);

      // Set expiry on first request
      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }

      // Get TTL for reset time
      const ttl = await redis.ttl(key);
      const reset = ttl > 0 ? now + ttl * 1000 : resetTime;

      return {
        success: count <= limit,
        limit,
        remaining: Math.max(0, limit - count),
        reset,
      };
    } catch (error) {
      console.error('[Rate Limit] Redis error:', error);
      // Fall through to memory store on Redis error
    }
  }

  // Fallback to in-memory store (development only)
  console.warn('[Rate Limit] Using in-memory store. Configure Redis for production!');
  
  const record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: resetTime });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: resetTime,
    };
  }

  record.count++;
  const success = record.count <= limit;

  return {
    success,
    limit,
    remaining: Math.max(0, limit - record.count),
    reset: record.resetAt,
  };
}

/**
 * Rate limit by IP address
 * 
 * @param req - Request object
 * @param limit - Maximum number of requests
 * @param windowSeconds - Time window in seconds
 * @returns Rate limit result
 */
export async function rateLimitByIP(
  req: Request,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const ip = getClientIP(req);
  return checkRateLimit(`ip:${ip}`, limit, windowSeconds);
}

/**
 * Rate limit by email
 * 
 * @param email - Email address
 * @param limit - Maximum number of requests
 * @param windowSeconds - Time window in seconds
 * @returns Rate limit result
 */
export async function rateLimitByEmail(
  email: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  return checkRateLimit(`email:${email}`, limit, windowSeconds);
}

/**
 * Combined rate limit (both IP and email must pass)
 * 
 * @param req - Request object
 * @param email - Email address
 * @param ipLimit - IP rate limit
 * @param emailLimit - Email rate limit
 * @param windowSeconds - Time window in seconds
 * @returns Rate limit result (most restrictive)
 */
export async function rateLimitCombined(
  req: Request,
  email: string,
  ipLimit: number,
  emailLimit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const [ipResult, emailResult] = await Promise.all([
    rateLimitByIP(req, ipLimit, windowSeconds),
    rateLimitByEmail(email, emailLimit, windowSeconds),
  ]);

  // Return the most restrictive result
  if (!ipResult.success) return ipResult;
  if (!emailResult.success) return emailResult;

  return {
    success: true,
    limit: Math.min(ipResult.limit, emailResult.limit),
    remaining: Math.min(ipResult.remaining, emailResult.remaining),
    reset: Math.max(ipResult.reset, emailResult.reset),
  };
}

/**
 * Get client IP address from request
 * 
 * @param req - Request object
 * @returns IP address
 */
export function getClientIP(req: Request): string {
  // Check various headers for IP address
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return 'unknown';
}

/**
 * Create rate limit response headers
 * 
 * @param result - Rate limit result
 * @returns Headers object
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  };
}

/**
 * Clean up expired entries from memory store (development only)
 * Call this periodically if using in-memory store
 */
export function cleanupMemoryStore() {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (now > record.resetAt) {
      memoryStore.delete(key);
    }
  }
}

// Clean up memory store every 5 minutes (development only)
if (!redis && typeof setInterval !== 'undefined') {
  setInterval(cleanupMemoryStore, 5 * 60 * 1000);
}
