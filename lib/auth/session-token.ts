import type { Role } from "@/types/domain";

export const authSessionCookie = "theaistack_session";

type SessionProvider = "google" | "password";

export type SessionPayload = {
  profileId: string;
  email: string;
  name: string;
  role: Role;
  provider: SessionProvider;
  exp: number;
};

export function getAuthSecret() {
  return process.env.AUTH_COOKIE_SECRET ?? process.env.RATE_LIMIT_SECRET ?? process.env.CRON_SECRET ?? "theaistack-dev-secret";
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
}

async function signValue(value: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(getAuthSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function encodeSessionPayload(payload: SessionPayload) {
  const body = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await signValue(body);
  return `${body}.${signature}`;
}

export async function decodeSessionCookie(rawValue: string | undefined) {
  if (!rawValue) {
    return null;
  }

  const [body, signature] = rawValue.split(".");
  if (!body || !signature) {
    return null;
  }

  const expectedSignature = await signValue(body);
  if (!timingSafeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(body))) as SessionPayload;
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
      return "/admin/dashboard";
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
