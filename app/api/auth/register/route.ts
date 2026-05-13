import { NextResponse } from "next/server";
import { z } from "zod";
import type { Role } from "@/types/domain";
import { prisma } from "@/lib/db/prisma";
import { sendVerificationEmail } from "@/lib/auth/email-verification";
import { hashPassword } from "@/lib/auth/password";

const registrationSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(2).max(120),
  password: z.string().min(8).max(72),
  role: z.enum(["user", "founder"])
});

function resolveRequestedRole(existingRole: Role | null | undefined, requestedRole: "user" | "founder"): Role {
  if (existingRole === "admin" || existingRole === "creator" || existingRole === "moderator") {
    return existingRole;
  }

  if (existingRole === "founder" || requestedRole === "founder") {
    return "founder";
  }

  return "user";
}

function getFounderCompanyName(name: string) {
  const firstName = name.trim().split(/\s+/)[0] ?? "Founder";
  return `${firstName}'s company`;
}

export async function POST(request: Request) {
  const payload = registrationSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Enter a valid name, email, and password." }, { status: 400 });
  }

  const email = payload.data.email.toLowerCase();

  try {
    const existingProfile = await prisma.profile.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
        emailVerifiedAt: true
      }
    });

    if (existingProfile?.role === "admin") {
      return NextResponse.json({ error: "This email belongs to the admin account. Use the admin login page instead." }, { status: 403 });
    }

    if (existingProfile?.emailVerifiedAt) {
      return NextResponse.json({ error: "An account with this email already exists. Sign in instead." }, { status: 409 });
    }

    const passwordHash = await hashPassword(payload.data.password);
    const resolvedRole = resolveRequestedRole(existingProfile?.role, payload.data.role);

    const profile = existingProfile
      ? await prisma.profile.update({
          where: { id: existingProfile.id },
          data: {
            email,
            fullName: payload.data.name,
            passwordHash,
            role: resolvedRole,
            emailVerifiedAt: null
          }
        })
      : await prisma.profile.create({
          data: {
            email,
            fullName: payload.data.name,
            passwordHash,
            role: resolvedRole
          }
        });

    if (resolvedRole === "founder") {
      await prisma.founderProfile.upsert({
        where: { userId: profile.id },
        update: {
          companyName: getFounderCompanyName(payload.data.name),
          title: "Founder"
        },
        create: {
          userId: profile.id,
          companyName: getFounderCompanyName(payload.data.name),
          title: "Founder"
        }
      });
    }

    await sendVerificationEmail({
      email: profile.email,
      name: profile.fullName,
      origin: new URL(request.url).origin,
      profileId: profile.id,
      role: resolvedRole === "founder" ? "founder" : "user"
    });

    return NextResponse.json({
      message: "Registration successful. Check your email to verify your account before signing in."
    });
  } catch {
    return NextResponse.json({ error: "Registration failed. Check the MySQL and email configuration and try again." }, { status: 503 });
  }
}
