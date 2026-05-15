import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { databaseErrorMessage } from "@/lib/db/database-error";
import { requireDatabaseUrl } from "@/lib/db/load-env";
import { prisma } from "@/lib/db/prisma";
import { getPortalAccessError } from "@/lib/auth/portals";
import { replaceUserSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  next: z.string().optional()
});

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function sanitizeNextPath(next: string | undefined) {
  return next?.startsWith("/") ? next : "/admin/dashboard";
}

function adminEnvCredential(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

export async function POST(request: Request) {
  const payload = adminLoginSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }

  const adminEmail = adminEnvCredential(process.env.ADMIN_LOGIN_EMAIL, "admin@gmail.com");
  const adminPassword = adminEnvCredential(process.env.ADMIN_LOGIN_PASSWORD, "12345678");
  const requestedEmail = payload.data.email.trim().toLowerCase();

  if (!safeEqual(requestedEmail, adminEmail.toLowerCase()) || !safeEqual(payload.data.password, adminPassword)) {
    return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
  }

  try {
    requireDatabaseUrl();

    const profile = await prisma.profile.upsert({
      where: {
        email: adminEmail
      },
      update: {
        fullName: "Platform Admin",
        role: "admin",
        isVerified: true
      },
      create: {
        email: adminEmail,
        fullName: "Platform Admin",
        role: "admin",
        isVerified: true
      }
    });

    const portalError = getPortalAccessError(profile.role, "admin");
    if (portalError) {
      return NextResponse.json({ error: portalError }, { status: 403 });
    }

    await replaceUserSession({
      id: profile.id,
      email: profile.email,
      name: profile.fullName ?? "Platform Admin",
      role: "admin",
      provider: "password"
    });

    return NextResponse.json({
      redirectTo: sanitizeNextPath(payload.data.next)
    });
  } catch (error) {
    console.error("Admin login database error:", error);
    return NextResponse.json({ error: databaseErrorMessage(error) }, { status: 503 });
  }
}
