import "server-only";

import { getMemberCompanyName } from "@/lib/auth/member-roles";
import { prisma } from "@/lib/db/prisma";

export {
  MEMBER_DASHBOARD_ROLES,
  canClaimAndManageListings,
  canUseMemberDashboard,
  getMemberCompanyName
} from "@/lib/auth/member-roles";

/** Listing plans / verification use FounderProfile even for `user` accounts. */
export async function ensureFounderProfileRecord(userId: string, displayName?: string | null) {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { fullName: true, email: true, founderProfile: { select: { companyName: true } } }
  });

  if (!profile) {
    return null;
  }

  const companyName =
    profile.founderProfile?.companyName ??
    getMemberCompanyName(profile.fullName ?? profile.email.split("@")[0] ?? "Member");

  return prisma.founderProfile.upsert({
    where: { userId },
    update: {
      companyName
    },
    create: {
      userId,
      companyName,
      title: "Founder"
    }
  });
}
