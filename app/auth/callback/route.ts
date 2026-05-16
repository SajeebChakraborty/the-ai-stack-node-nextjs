import { NextResponse } from "next/server";
import { ensureFounderProfileRecord } from "@/lib/auth/member-access";
import {
  decodeGoogleState,
  exchangeCodeForGoogleProfile,
  getDefaultPathForGoogleRole,
  getGoogleLoginPath,
  resolveAppOrigin,
  resolvePostLoginPath
} from "@/lib/auth/google";
import { getPortalAccessError } from "@/lib/auth/portals";
import { replaceUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function buildErrorRedirect(request: Request, loginPath: string, nextPath: string, error: string) {
  const redirectUrl = new URL(loginPath, request.url);
  redirectUrl.searchParams.set("next", nextPath);
  redirectUrl.searchParams.set("error", error);
  return NextResponse.redirect(redirectUrl);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = decodeGoogleState(requestUrl.searchParams.get("state"));

  const nextPath = resolvePostLoginPath(state?.next);
  const loginPath = getGoogleLoginPath();

  if (!code || !state) {
    return buildErrorRedirect(request, loginPath, nextPath, "invalid-google-session");
  }

  try {
    const googleProfile = await exchangeCodeForGoogleProfile({
      code,
      origin: requestUrl.origin
    });

    if (googleProfile.email_verified === false) {
      return buildErrorRedirect(request, loginPath, nextPath, "google-email-not-verified");
    }

    const existingByExternalId = await prisma.profile.findUnique({
      where: {
        externalAuthId: googleProfile.sub
      },
      include: {
        founderProfile: true
      }
    });

    const existingByEmail = await prisma.profile.findUnique({
      where: {
        email: googleProfile.email
      },
      include: {
        founderProfile: true
      }
    });

    if (existingByExternalId && existingByEmail && existingByExternalId.id !== existingByEmail.id) {
      return buildErrorRedirect(request, loginPath, nextPath, "google-account-conflict");
    }

    const existingProfile = existingByExternalId ?? existingByEmail;
    const resolvedRole = existingProfile?.role ?? "user";
    const portalError = getPortalAccessError(resolvedRole, "user");
    if (portalError) {
      return buildErrorRedirect(request, loginPath, nextPath, "wrong-account-portal");
    }

    const hydratedProfile = existingProfile
      ? await prisma.profile.update({
          where: {
            id: existingProfile.id
          },
          data: {
            externalAuthId: googleProfile.sub,
            email: googleProfile.email,
            fullName: googleProfile.name ?? existingProfile.fullName ?? googleProfile.email.split("@")[0],
            avatarUrl: googleProfile.picture ?? existingProfile.avatarUrl,
            emailVerifiedAt: new Date(),
            emailVerificationTokenHash: null,
            emailVerificationExpiresAt: null,
            isVerified: true
          }
        })
      : await prisma.profile.create({
          data: {
            externalAuthId: googleProfile.sub,
            email: googleProfile.email,
            fullName: googleProfile.name ?? googleProfile.email.split("@")[0],
            avatarUrl: googleProfile.picture,
            role: "user",
            emailVerifiedAt: new Date(),
            emailVerificationTokenHash: null,
            emailVerificationExpiresAt: null,
            isVerified: true
          }
        });

    await ensureFounderProfileRecord(hydratedProfile.id, hydratedProfile.fullName);

    await replaceUserSession({
      id: hydratedProfile.id,
      email: hydratedProfile.email,
      name: hydratedProfile.fullName ?? hydratedProfile.email.split("@")[0],
      role: hydratedProfile.role,
      provider: "google"
    });

    return NextResponse.redirect(new URL(nextPath, resolveAppOrigin(requestUrl.origin)));
  } catch {
    return buildErrorRedirect(request, loginPath, nextPath, "google-login-failed");
  }
}
