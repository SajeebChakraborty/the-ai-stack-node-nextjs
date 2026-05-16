import { NextResponse } from "next/server";
import { z } from "zod";
import { canUseMemberDashboard } from "@/lib/auth/member-access";
import { getCurrentUser } from "@/lib/auth/session";
import { getEditableProfile } from "@/lib/queries/profile";
import { prisma } from "@/lib/db/prisma";

const profileSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  handle: z
    .string()
    .trim()
    .max(40)
    .regex(/^[a-z0-9_-]*$/i, "Handle can only use letters, numbers, underscores, and hyphens.")
    .optional()
    .or(z.literal("")),
  bio: z.string().trim().max(500).optional().or(z.literal("")),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  websiteUrl: z.string().trim().url().optional().or(z.literal("")),
  avatarUrl: z.string().trim().url().optional().or(z.literal("")),
  companyName: z.string().trim().max(160).optional().or(z.literal("")),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  niche: z.string().trim().max(120).optional().or(z.literal(""))
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const profile = await getEditableProfile(user.id);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const payload = profileSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Enter valid profile details." }, { status: 400 });
  }

  const data = payload.data;
  const handle = data.handle?.trim() || null;

  if (handle) {
    const existingHandle = await prisma.profile.findFirst({
      where: {
        handle,
        NOT: { id: user.id }
      },
      select: { id: true }
    });

    if (existingHandle) {
      return NextResponse.json({ error: "That handle is already taken." }, { status: 409 });
    }
  }

  await prisma.profile.update({
    where: { id: user.id },
    data: {
      fullName: data.fullName,
      handle,
      bio: data.bio || null,
      location: data.location || null,
      websiteUrl: data.websiteUrl || null,
      avatarUrl: data.avatarUrl || null
    }
  });

  if (canUseMemberDashboard(user.role)) {
    await prisma.founderProfile.upsert({
      where: { userId: user.id },
      update: {
        companyName: data.companyName || undefined,
        title: data.title || undefined
      },
      create: {
        userId: user.id,
        companyName: data.companyName || `${data.fullName}'s company`,
        title: data.title || "Founder"
      }
    });
  }

  if (user.role === "creator" && data.niche) {
    await prisma.creatorProfile.upsert({
      where: { userId: user.id },
      update: { niche: data.niche },
      create: {
        userId: user.id,
        niche: data.niche,
        verifiedChannels: []
      }
    });
  }

  const profile = await getEditableProfile(user.id);
  return NextResponse.json({ message: "Profile updated.", profile });
}
