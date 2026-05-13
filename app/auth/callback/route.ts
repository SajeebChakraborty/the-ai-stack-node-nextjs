import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  decodeGoogleState,
  exchangeCodeForGoogleProfile,
  getDefaultPathForGoogleRole,
  getGoogleLoginPath
} from "@/lib/auth/google";
import { setCurrentUserSession } from "@/lib/auth/session";

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

  const requestedRole = state?.role ?? "user";
  const nextPath = state?.next ?? getDefaultPathForGoogleRole(requestedRole);
  const loginPath = getGoogleLoginPath(requestedRole);

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
    const role =
      existingProfile?.role && existingProfile.role !== "user"
        ? existingProfile.role
        : state.role;

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
            role,
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
            role,
            emailVerifiedAt: new Date(),
            emailVerificationTokenHash: null,
            emailVerificationExpiresAt: null,
            isVerified: true
          }
        });

    if (role === "founder") {
      await prisma.founderProfile.upsert({
        where: {
          userId: hydratedProfile.id
        },
        update: {},
        create: {
          userId: hydratedProfile.id,
          companyName: `${(hydratedProfile.fullName ?? "Founder").split(" ")[0]}'s company`,
          title: "Founder"
        }
      });
    }

    await setCurrentUserSession({
      id: hydratedProfile.id,
      email: hydratedProfile.email,
      name: hydratedProfile.fullName ?? hydratedProfile.email.split("@")[0],
      role: hydratedProfile.role,
      provider: "google"
    });

    return NextResponse.redirect(new URL(nextPath, request.url));
  } catch {
    return buildErrorRedirect(request, loginPath, nextPath, "google-login-failed");
  }
}
