// Prisma Client Setup (Prisma 7 — client engine with pg adapter)
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // During build/prerender, DATABASE_URL may not exist — return a dummy that
    // will throw at query time rather than at import time.
    console.warn("DATABASE_URL is not set — Prisma queries will fail at runtime.");
    return new Proxy({} as PrismaClient, {
      get(_, prop) {
        if (typeof prop === 'string') {
          throw new Error(`DATABASE_URL is not set. Cannot access prisma.${prop}`);
        }
        return undefined;
      },
    });
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
