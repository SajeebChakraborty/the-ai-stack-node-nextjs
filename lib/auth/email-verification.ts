import "server-only";

import { createHash, randomBytes } from "node:crypto";
import type { Role } from "@/types/domain";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/sendgrid";

const verificationLifetimeMs = 1000 * 60 * 60 * 24;

type VerificationRole = Extract<Role, "user" | "founder">;

function getAuthOrigin(origin?: string) {
  return process.env.NEXT_PUBLIC_APP_URL ?? origin ?? "http://localhost:3000";
}

function getLoginPath(role: VerificationRole) {
  return role === "founder" ? "/auth/founder/login" : "/auth/login";
}

function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function sendVerificationEmail({
  email,
  name,
  origin,
  profileId,
  role
}: {
  email: string;
  name?: string | null;
  origin?: string;
  profileId: string;
  role: VerificationRole;
}) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + verificationLifetimeMs);

  await prisma.profile.update({
    where: { id: profileId },
    data: {
      emailVerificationTokenHash: hashVerificationToken(token),
      emailVerificationExpiresAt: expiresAt
    }
  });

  const verifyUrl = new URL("/auth/verify-email", getAuthOrigin(origin));
  verifyUrl.searchParams.set("token", token);
  verifyUrl.searchParams.set("role", role);

  const appName = "TheAiStack";
  const recipientName = name?.trim() || "there";
  const subject = `Verify your ${appName} ${role} account`;
  const text = [
    `Hi ${recipientName},`,
    "",
    `Verify your ${appName} ${role} account by opening this link:`,
    verifyUrl.toString(),
    "",
    "This link expires in 24 hours."
  ].join("\n");
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
      <h2 style="margin-bottom: 16px;">Verify your ${appName} ${role} account</h2>
      <p style="margin-bottom: 16px;">Hi ${recipientName},</p>
      <p style="margin-bottom: 24px;">
        Confirm your email address to finish setting up your ${role} access for ${appName}.
      </p>
      <p style="margin-bottom: 24px;">
        <a href="${verifyUrl.toString()}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px;">
          Verify email
        </a>
      </p>
      <p style="margin-bottom: 8px; font-size: 14px; color: #4b5563;">This link expires in 24 hours.</p>
      <p style="font-size: 14px; color: #4b5563;">If you did not create this account, you can ignore this email.</p>
    </div>
  `;

  await sendEmail({
    html,
    subject,
    text,
    toEmail: email,
    toName: name
  });
}

export async function verifyEmailToken(token: string) {
  const tokenHash = hashVerificationToken(token);
  const profile = await prisma.profile.findFirst({
    where: {
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: {
        gt: new Date()
      }
    },
    select: {
      id: true,
      role: true
    }
  });

  if (!profile) {
    return null;
  }

  await prisma.profile.update({
    where: {
      id: profile.id
    },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
      isVerified: true
    }
  });

  return {
    loginPath: getLoginPath(profile.role === "founder" ? "founder" : "user"),
    role: profile.role
  };
}
