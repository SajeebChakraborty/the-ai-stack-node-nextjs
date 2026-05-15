import "server-only";

import { prisma } from "@/lib/db/prisma";

export async function getEditableProfile(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    include: {
      founderProfile: true,
      creatorProfile: true
    }
  });

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    fullName: profile.fullName ?? "",
    handle: profile.handle ?? "",
    bio: profile.bio ?? "",
    location: profile.location ?? "",
    websiteUrl: profile.websiteUrl ?? "",
    avatarUrl: profile.avatarUrl ?? "",
    companyName: profile.founderProfile?.companyName ?? "",
    title: profile.founderProfile?.title ?? "",
    niche: profile.creatorProfile?.niche ?? ""
  };
}
