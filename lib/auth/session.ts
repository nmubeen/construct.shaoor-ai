import { prisma } from "@/lib/prisma";
import { generateSessionToken, getSessionExpiry } from "./token";
import {
  clearSessionCookie,
  getSessionCookie,
  setSessionCookie,
} from "./cookies";

/**
 * Creates a new session for the specified user.
 */
export async function createSession(userId: number) {
  const token = generateSessionToken();
  const expiresAt = getSessionExpiry();

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  await setSessionCookie(token, expiresAt);

  return token;
}

/**
 * Returns the current session record.
 */
export async function getSession() {
  const token = await getSessionCookie();

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      token,
    },
    include: {
      user: true,
    },
  });

  if (!session) {
    
    return null;
  }

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({
      where: {
        id: session.id,
      },
    });

    await clearSessionCookie();

    return null;
  }

  return session;
}

/**
 * Returns the currently authenticated user.
 */
export async function getCurrentUser() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return session.user;
}

/**
 * Destroys the current session.
 */
export async function destroySession() {
  const token = await getSessionCookie();

  if (!token) {
    return;
  }

  await prisma.session.deleteMany({
    where: {
      token,
    },
  });

  await clearSessionCookie();
}

/**
 * Removes expired sessions.
 */
export async function cleanupExpiredSessions() {
  await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}