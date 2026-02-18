import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, getClientIP, createRateLimitHeaders, cleanupMemoryStore } from '@/lib/rate-limit';
import { createMockRequest } from '../helpers';

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clean up memory store between tests
    cleanupMemoryStore();
  });

  describe('checkRateLimit', () => {
    it('should allow requests within the limit', async () => {
      const result = await checkRateLimit('test-user-1', 5, 60);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.limit).toBe(5);
    });

    it('should decrement remaining count on subsequent requests', async () => {
      await checkRateLimit('test-user-2', 5, 60);
      const result = await checkRateLimit('test-user-2', 5, 60);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(3);
    });

    it('should block requests after limit is exceeded', async () => {
      const identifier = 'test-user-blocked';
      for (let i = 0; i < 3; i++) {
        await checkRateLimit(identifier, 3, 60);
      }
      const result = await checkRateLimit(identifier, 3, 60);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should use different keys for different identifiers', async () => {
      await checkRateLimit('user-a', 1, 60);
      const result = await checkRateLimit('user-b', 1, 60);
      expect(result.success).toBe(true);
    });
  });

  describe('getClientIP', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const req = createMockRequest('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
      });
      expect(getClientIP(req)).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-real-ip': '10.0.0.1' },
      });
      expect(getClientIP(req)).toBe('10.0.0.1');
    });

    it('should extract IP from cf-connecting-ip header', () => {
      const req = new Request('http://localhost', {
        headers: { 'cf-connecting-ip': '172.16.0.1' },
      });
      expect(getClientIP(req)).toBe('172.16.0.1');
    });

    it('should return "unknown" when no IP headers are present', () => {
      const req = new Request('http://localhost');
      expect(getClientIP(req)).toBe('unknown');
    });

    it('should prefer x-forwarded-for over other headers', () => {
      const req = createMockRequest('http://localhost', {
        headers: {
          'x-forwarded-for': '1.1.1.1',
          'x-real-ip': '2.2.2.2',
          'cf-connecting-ip': '3.3.3.3',
        },
      });
      expect(getClientIP(req)).toBe('1.1.1.1');
    });
  });

  describe('createRateLimitHeaders', () => {
    it('should create proper rate limit response headers', () => {
      const result = {
        success: true,
        limit: 10,
        remaining: 7,
        reset: 1700000000000,
      };
      const headers = createRateLimitHeaders(result);

      expect(headers['X-RateLimit-Limit']).toBe('10');
      expect(headers['X-RateLimit-Remaining']).toBe('7');
      expect(headers['X-RateLimit-Reset']).toBeDefined();
    });
  });
});
