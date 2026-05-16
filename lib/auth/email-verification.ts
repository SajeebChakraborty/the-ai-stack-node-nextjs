import "server-only";

import { createHash, randomBytes } from "node:crypto";
import type { Role } from "@/types/domain";
import { prisma } from "@/lib/db/prisma";
import { resolveAppOrigin, resolveAppOriginFromRequest } from "@/lib/auth/app-origin";
import { sendEmail } from "@/lib/email/sendgrid";

const verificationLifetimeMs = 1000 * 60 * 60 * 24;

type VerificationRole = Extract<Role, "user" | "founder">;

function getLoginPath(_role: VerificationRole) {
  return "/auth/login";
  // return role === "founder" ? "/auth/founder/login" : "/auth/login";
}

function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function sendVerificationEmail({
  email,
  name,
  request,
  origin,
  profileId,
  role
}: {
  email: string;
  name?: string | null;
  request?: Request;
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

  const authOrigin = request ? resolveAppOriginFromRequest(request) : resolveAppOrigin(origin);
  const verifyUrl = new URL("/auth/verify-email", authOrigin);
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
    loginPath: getLoginPath("user"),
    role: profile.role
  };
}
