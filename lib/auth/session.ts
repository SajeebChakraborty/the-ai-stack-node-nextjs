import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@/types/domain";
import { prisma } from "@/lib/db/prisma";
import {
  authSessionCookie,
  decodeSessionCookie,
  encodeSessionPayload,
  getDefaultHomeForRole,
  getLoginPathForRoles,
  type SessionPayload
} from "@/lib/auth/session-token";

export { authSessionCookie, getDefaultHomeForRole, getLoginPathForRoles };

const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;

type SessionProvider = "google" | "password";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  provider: SessionProvider;
};

type SessionUser = CurrentUser & {
  id: string;
};

export async function replaceUserSession(user: SessionUser) {
  await clearCurrentUserSession();
  await setCurrentUserSession(user);
}

export async function setCurrentUserSession(user: SessionUser) {
  const cookieStore = await cookies();
  const payload: SessionPayload = {
    profileId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    provider: user.provider,
    exp: Date.now() + sessionMaxAgeSeconds * 1000
  };

  cookieStore.set(authSessionCookie, await encodeSessionPayload(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds
  });
}

export async function clearCurrentUserSession() {
  const cookieStore = await cookies();
  cookieStore.delete(authSessionCookie);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const payload = await decodeSessionCookie(cookieStore.get(authSessionCookie)?.value);

  if (!payload) {
    return null;
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { id: payload.profileId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true
      }
    });

    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.fullName ?? payload.name ?? profile.email.split("@")[0],
      role: profile.role as Role,
      provider: payload.provider
    };
  } catch {
    return {
      id: payload.profileId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      provider: payload.provider
    };
  }
}

export async function requireUser(nextPath: string, allowedRoles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`${getLoginPathForRoles(allowedRoles)}?next=${encodeURIComponent(nextPath)}`);
  }

  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    redirect(getDefaultHomeForRole(user.role));
  }

  return user;
}
