import { vi } from 'vitest';

/**
 * Creates a mock Prisma client for testing
 */
export function createMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    session: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    team: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    teamMember: {
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      delete: vi.fn(),
    },
    otp: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    submission: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn(createMockPrisma())),
  };
}

/**
 * Creates a mock Request object
 */
export function createMockRequest(
  url = 'http://localhost:3000',
  options: RequestInit & { headers?: Record<string, string> } = {}
) {
  const headers = new Headers(options.headers ?? {});
  if (!headers.has('x-forwarded-for')) {
    headers.set('x-forwarded-for', '127.0.0.1');
  }

  return new Request(url, {
    ...options,
    headers,
  });
}

/**
 * Creates a mock JSON request body
 */
export function createMockJsonRequest(
  url: string,
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  return createMockRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}
