import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.UPSTASH_REDIS_URL = '';
process.env.UPSTASH_REDIS_TOKEN = '';
process.env.RESEND_API_KEY = 'test_key';
process.env.CLOUDINARY_CLOUD_NAME = 'test_cloud';
process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'test_cloud';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => new Map()),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => '/'),
}));
