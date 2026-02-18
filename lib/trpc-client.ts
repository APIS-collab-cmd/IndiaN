// tRPC Client Setup
"use client";

import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/server/routers/_app";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

export function getBaseUrl() {
  if (typeof window !== "undefined") return ""; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
}

export function getTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson,
        headers() {
          // Get token from cookie or localStorage
          const token = typeof window !== "undefined" 
            ? localStorage.getItem("session_token")
            : null;
          
          return {
            authorization: token ? `Bearer ${token}` : "",
          };
        },
      }),
    ],
  });
}
