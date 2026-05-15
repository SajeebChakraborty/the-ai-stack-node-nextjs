import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { prisma } from "@/lib/db/prisma";

const updateSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  role: z.enum(["user", "creator", "founder", "moderator", "admin"]).optional(),
  trustScore: z.number().int().min(0).max(100).optional(),
  isVerified: z.boolean().optional(),
  suspended: z.boolean().optional(),
  companyName: z.string().trim().max(160).optional(),
  title: z.string().trim().max(120).optional()
});

type Context = {
  params: Promise<{ userId: string }>;
};

export async function PATCH(request: Request, context: Context) {
  const { user, error } = await requireAdminApi();
  if (error) {
    return error;
  }

  const { userId } = await context.params;
  const payload = updateSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid update payload." }, { status: 400 });
  }

  const existing = await prisma.profile.findUnique({
    where: { id: userId },
    include: { founderProfile: true, creatorProfile: true }
  });

  if (!existing) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (existing.role === "admin" && payload.data.role && payload.data.role !== "admin") {
    const adminCount = await prisma.profile.count({ where: { role: "admin" } });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "At least one admin account must remain." }, { status: 400 });
    }
  }

  const nextRole = payload.data.role ?? existing.role;

  await prisma.profile.update({
    where: { id: userId },
    data: {
      fullName: payload.data.fullName,
      role: payload.data.role,
      trustScore: payload.data.trustScore,
      isVerified: existing.role === "founder" ? undefined : payload.data.isVerified,
      suspendedAt: payload.data.suspended === undefined ? undefined : payload.data.suspended ? new Date() : null
    }
  });

  if (nextRole === "founder" && (payload.data.companyName !== undefined || payload.data.title !== undefined)) {
    await prisma.founderProfile.upsert({
      where: { userId },
      update: {
        companyName: payload.data.companyName,
        title: payload.data.title
      },
      create: {
        userId,
        companyName: payload.data.companyName ?? existing.fullName ?? "Company",
        title: payload.data.title ?? "Founder"
      }
    });
  }

  if (nextRole === "creator" && !existing.creatorProfile) {
    await prisma.creatorProfile.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        niche: "General",
        verifiedChannels: []
      }
    });
  }

  return NextResponse.json({ message: "User updated." });
}

export async function DELETE(_request: Request, context: Context) {
  const { user, error } = await requireAdminApi();
  if (error) {
    return error;
  }

  const { userId } = await context.params;

  if (userId === user.id) {
    return NextResponse.json({ error: "You cannot delete your own admin account." }, { status: 400 });
  }

  const existing = await prisma.profile.findUnique({
    where: { id: userId },
    select: { id: true, role: true }
  });

  if (!existing) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (existing.role === "admin") {
    const adminCount = await prisma.profile.count({ where: { role: "admin" } });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "At least one admin account must remain." }, { status: 400 });
    }
  }

  await prisma.profile.delete({
    where: { id: userId }
  });

  return NextResponse.json({ message: "User deleted." });
}
