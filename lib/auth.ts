// Authentication Helper Functions
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return {
    user: session.user,
    token: session.token,
  };
}

export async function checkAdminAuth() {
  const session = await getSession();
  
  if (!session) {
    return null;
  }

  const allowedRoles = ["ADMIN", "SUPER_ADMIN", "ORGANIZER"];
  if (!allowedRoles.includes(session.user.role)) {
    return null;
  }

  return session.user;
}

export async function requireAuth() {
  const session = await getSession();
  
  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}

export async function requireAdminAuth() {
  const user = await checkAdminAuth();
  
  if (!user) {
    throw new Error("Admin access required");
  }

  return user;
}
