import { NextResponse } from "next/server";
import { z } from "zod";
import { getPortalAccessError, type AuthPortal } from "@/lib/auth/portals";
import { getDefaultHomeForRole, replaceUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";

const loginSchema = z.object({
  email: z.string().trim().email(),
  next: z.string().optional(),
  password: z.string().min(1),
  role: z.enum(["user", "founder"])
});

function sanitizeRedirectTarget(next: string | undefined, requestedRole: "user" | "founder", resolvedRole: Parameters<typeof getDefaultHomeForRole>[0]) {
  const requestedDefault = requestedRole === "founder" ? "/founder/dashboard" : "/directory";
  return next?.startsWith("/") && next !== requestedDefault ? next : getDefaultHomeForRole(resolvedRole);
}

export async function POST(request: Request) {
  const payload = loginSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }

  const email = payload.data.email.toLowerCase();

  try {
    const profile = await prisma.profile.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        passwordHash: true,
        emailVerifiedAt: true,
        role: true
      }
    });

    if (!profile?.passwordHash) {
      return NextResponse.json({ error: "No password login is configured for this account. Use Google sign in instead." }, { status: 401 });
    }

    const isPasswordValid = await verifyPassword(payload.data.password, profile.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (!profile.emailVerifiedAt) {
      return NextResponse.json({ error: "Verify your email before signing in." }, { status: 403 });
    }

    const portal: AuthPortal = payload.data.role === "founder" ? "founder" : "user";
    const portalError = getPortalAccessError(profile.role, portal);
    if (portalError) {
      return NextResponse.json({ error: portalError }, { status: 403 });
    }

    await replaceUserSession({
      id: profile.id,
      email: profile.email,
      name: profile.fullName ?? profile.email.split("@")[0],
      role: profile.role,
      provider: "password"
    });

    return NextResponse.json({
      redirectTo: sanitizeRedirectTarget(payload.data.next, payload.data.role, profile.role)
    });
  } catch {
    return NextResponse.json({ error: "Login failed. Check the MySQL configuration and try again." }, { status: 503 });
  }
}
