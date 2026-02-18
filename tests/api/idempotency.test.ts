import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Idempotency Logic', () => {
  // Replicate the idempotency logic for isolated testing
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

  let idempotencyStore: Map<string, { response: IdempotencyResponse; timestamp: number }>;

  function checkIdempotency(key: string): IdempotencyResponse | null {
    const record = idempotencyStore.get(key);
    if (!record) return null;
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

  beforeEach(() => {
    idempotencyStore = new Map();
  });

  const sampleResponse: IdempotencyResponse = {
    success: true,
    message: 'Registered',
    data: {
      teamId: 'team-1',
      submissionId: 'sub-1',
      teamName: 'Test Team',
      track: 'IDEA_SPRINT',
    },
  };

  it('should return null for non-existent key', () => {
    expect(checkIdempotency('non-existent')).toBeNull();
  });

  it('should return stored response for existing key', () => {
    storeIdempotency('key-1', sampleResponse);
    expect(checkIdempotency('key-1')).toEqual(sampleResponse);
  });

  it('should expire entries after 24 hours', () => {
    const key = 'expired-key';
    idempotencyStore.set(key, {
      response: sampleResponse,
      timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
    });
    expect(checkIdempotency(key)).toBeNull();
    expect(idempotencyStore.has(key)).toBe(false);
  });

  it('should not expire entries within 24 hours', () => {
    const key = 'valid-key';
    idempotencyStore.set(key, {
      response: sampleResponse,
      timestamp: Date.now() - 23 * 60 * 60 * 1000, // 23 hours ago
    });
    expect(checkIdempotency(key)).toEqual(sampleResponse);
  });

  it('should handle duplicate request detection', () => {
    storeIdempotency('dup-key', sampleResponse);
    // Second call with same key returns same response
    const result = checkIdempotency('dup-key');
    expect(result).toEqual(sampleResponse);
    expect(result?.data.teamId).toBe('team-1');
  });
});
