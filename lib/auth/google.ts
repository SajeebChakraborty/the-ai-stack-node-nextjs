import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Role } from "@/types/domain";

const googleAuthorizeUrl = "https://accounts.google.com/o/oauth2/v2/auth";
const googleTokenUrl = "https://oauth2.googleapis.com/token";
const googleUserInfoUrl = "https://www.googleapis.com/oauth2/v3/userinfo";

type GoogleRole = Extract<Role, "user" | "founder">;

type GoogleOAuthState = {
  role: GoogleRole;
  next: string;
  nonce: string;
  exp: number;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

export type GoogleProfile = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured.");
  }

  return { clientId, clientSecret };
}

function getStateSecret() {
  return process.env.AUTH_COOKIE_SECRET ?? process.env.RATE_LIMIT_SECRET ?? process.env.CRON_SECRET ?? "theaistack-dev-secret";
}

function signState(value: string) {
  return createHmac("sha256", getStateSecret()).update(value).digest("base64url");
}

function encodeState(payload: GoogleOAuthState) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${signState(body)}`;
}

function sanitizeNextPath(next: string | null | undefined, fallbackPath: string) {
  return next?.startsWith("/") ? next : fallbackPath;
}

function getAuthOrigin(origin: string) {
  return process.env.NEXT_PUBLIC_APP_URL ?? origin;
}

export function getDefaultPathForGoogleRole(role: GoogleRole) {
  return role === "founder" ? "/founder/dashboard" : "/directory";
}

export function getGoogleLoginPath(role: GoogleRole) {
  return role === "founder" ? "/auth/founder/login" : "/auth/login";
}

export function decodeGoogleState(rawState: string | null) {
  if (!rawState) {
    return null;
  }

  const [body, signature] = rawState.split(".");
  if (!body || !signature) {
    return null;
  }

  const expectedSignature = signState(body);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as GoogleOAuthState;
    if (payload.exp <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function buildGoogleAuthorizationUrl({
  role,
  next,
  origin
}: {
  role: GoogleRole;
  next?: string;
  origin: string;
}) {
  const { clientId } = getGoogleConfig();
  const fallbackPath = getDefaultPathForGoogleRole(role);
  const redirectUri = new URL("/auth/callback", getAuthOrigin(origin)).toString();
  const state = encodeState({
    role,
    next: sanitizeNextPath(next, fallbackPath),
    nonce: randomBytes(12).toString("hex"),
    exp: Date.now() + 10 * 60 * 1000
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    state
  });

  return `${googleAuthorizeUrl}?${params.toString()}`;
}

export async function exchangeCodeForGoogleProfile({
  code,
  origin
}: {
  code: string;
  origin: string;
}) {
  const { clientId, clientSecret } = getGoogleConfig();
  const redirectUri = new URL("/auth/callback", getAuthOrigin(origin)).toString();

  const tokenResponse = await fetch(googleTokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });

  const tokenPayload = (await tokenResponse.json()) as GoogleTokenResponse;
  if (!tokenResponse.ok || !tokenPayload.access_token) {
    throw new Error(tokenPayload.error_description ?? tokenPayload.error ?? "Google token exchange failed.");
  }

  const profileResponse = await fetch(googleUserInfoUrl, {
    headers: {
      Authorization: `Bearer ${tokenPayload.access_token}`
    }
  });

  const profile = (await profileResponse.json()) as GoogleProfile;
  if (!profileResponse.ok || !profile.email || !profile.sub) {
    throw new Error("Google profile lookup failed.");
  }

  return profile;
}
