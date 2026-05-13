import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@/types/domain";
import { prisma } from "@/lib/db/prisma";

export const authSessionCookie = "theaistack_session";

const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;

type SessionProvider = "google" | "password";

type SessionPayload = {
  profileId: string;
  email: string;
  name: string;
  role: Role;
  provider: SessionProvider;
  exp: number;
};

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

function getAuthSecret() {
  return process.env.AUTH_COOKIE_SECRET ?? process.env.RATE_LIMIT_SECRET ?? process.env.CRON_SECRET ?? "theaistack-dev-secret";
}

function signValue(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

function encodePayload(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signValue(body);
  return `${body}.${signature}`;
}

function decodePayload(rawValue: string | undefined) {
  if (!rawValue) {
    return null;
  }

  const [body, signature] = rawValue.split(".");
  if (!body || !signature) {
    return null;
  }

  const expectedSignature = signValue(body);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (payload.exp <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getDefaultHomeForRole(role: Role) {
  switch (role) {
    case "admin":
      return "/admin";
    case "founder":
      return "/founder/dashboard";
    case "creator":
      return "/creator/dashboard";
    default:
      return "/directory";
  }
}

export function getLoginPathForRoles(allowedRoles?: Role[]) {
  if (!allowedRoles?.length) {
    return "/auth/login";
  }

  if (allowedRoles.includes("admin")) {
    return "/auth/admin/login";
  }

  if (allowedRoles.includes("founder")) {
    return "/auth/founder/login";
  }

  return "/auth/login";
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

  cookieStore.set(authSessionCookie, encodePayload(payload), {
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
  const payload = decodePayload(cookieStore.get(authSessionCookie)?.value);

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
