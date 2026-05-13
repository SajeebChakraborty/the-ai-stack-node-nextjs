import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { setCurrentUserSession } from "@/lib/auth/session";

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
  return next?.startsWith("/") ? next : "/admin";
}

export async function POST(request: Request) {
  const payload = adminLoginSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }

  const adminEmail = process.env.ADMIN_LOGIN_EMAIL ?? "admin@gmail.com";
  const adminPassword = process.env.ADMIN_LOGIN_PASSWORD ?? "12345678";
  const requestedEmail = payload.data.email.trim().toLowerCase();

  if (!safeEqual(requestedEmail, adminEmail.toLowerCase()) || !safeEqual(payload.data.password, adminPassword)) {
    return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
  }

  try {
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

    await setCurrentUserSession({
      id: profile.id,
      email: profile.email,
      name: profile.fullName ?? "Platform Admin",
      role: "admin",
      provider: "password"
    });

    return NextResponse.json({
      redirectTo: sanitizeNextPath(payload.data.next)
    });
  } catch {
    return NextResponse.json({ error: "MySQL database is unavailable for admin login." }, { status: 503 });
  }
}
