// tRPC Server Setup
//
// ARCHITECTURE NOTE:
// ─────────────────────────────────────────────────────────────
// This project uses TWO API layers by design:
//
// 1. REST (/api/send-otp, /api/verify-otp, /api/register)
//    → Public registration flow. OTP-based, no session required.
//    → Used by: HackathonForm.tsx (participant-facing)
//
// 2. tRPC (/api/trpc/*)
//    → Authenticated admin panel + post-registration management.
//    → Used by: /admin/* pages, future team dashboard
//    → Routers: admin (dashboard/teams/export), auth (profile/notifications),
//               team (submission updates, withdraw)
//
// These are NOT duplicate systems — they serve different auth models.
// ─────────────────────────────────────────────────────────────

import { initTRPC, TRPCError } from "@trpc/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";

/**
 * Parse cookies from a raw Cookie header string.
 */
function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [key, ...rest] = c.trim().split('=');
      return [key, rest.join('=')];
    })
  );
}

// Create context for each request (App Router / Fetch adapter)
export async function createContext(opts: FetchCreateContextFnOptions) {
  // Read token from Authorization header or session cookie
  const authHeader = opts.req.headers.get('authorization');
  const cookies = parseCookies(opts.req.headers.get('cookie'));
  const token = authHeader?.replace('Bearer ', '') || cookies.session || null;

  let session = null;
  if (token) {
    const sessionData = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (sessionData && sessionData.expiresAt > new Date()) {
      session = {
        user: sessionData.user,
        token: sessionData.token,
      };
    }
  }

  return {
    session,
    prisma,
    req: opts.req,
    resHeaders: opts.resHeaders,
  };
}

type Context = Awaited<ReturnType<typeof createContext>>;

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Export reusable router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

// Auth middleware
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

// Admin middleware
const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  
  const allowedRoles = ["ADMIN", "SUPER_ADMIN", "ORGANIZER"];
  if (!allowedRoles.includes(ctx.session.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  
  return next({ ctx });
});

// Protected procedures
export const protectedProcedure = t.procedure.use(isAuthed);
export const adminProcedure = t.procedure.use(isAdmin);
