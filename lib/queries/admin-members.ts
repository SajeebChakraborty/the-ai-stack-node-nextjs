import { prisma } from "@/lib/db/prisma";
import { syncFounderPaymentVerification } from "@/lib/founders/verification";
import type { Role } from "@/types/domain";
import type { AdminMember } from "@/types/admin";

const memberInclude = {
  founderProfile: true,
  subscriptions: {
    where: {
      status: { in: ["active", "trialing"] as ("active" | "trialing")[] }
    },
    include: {
      plan: { select: { monthlyPrice: true } },
      payments: {
        where: { amountPaid: { gt: 0 } },
        take: 1
      }
    }
  },
  _count: {
    select: {
      socialAccounts: true,
      tools: true
    }
  }
};

type ProfileRow = {
  id: string;
  email: string;
  fullName: string | null;
  role: Role;
  handle: string | null;
  trustScore: number;
  isVerified: boolean;
  suspendedAt: Date | null;
  createdAt: Date;
  founderProfile: { companyName: string; title: string; verifiedAt: Date | null } | null;
  subscriptions: Array<{
    status: string;
    plan: { monthlyPrice: unknown };
    payments: Array<{ amountPaid: number }>;
  }>;
  _count: { socialAccounts: number; tools: number };
};

function hasActivePaidSubscription(profile: ProfileRow) {
  return profile.subscriptions.some((subscription) => {
    if (!["active", "trialing"].includes(subscription.status)) {
      return false;
    }

    if (subscription.payments.some((payment) => payment.amountPaid > 0)) {
      return true;
    }

    return Number(subscription.plan.monthlyPrice) > 0;
  });
}

function mapProfileToAdminMember(profile: ProfileRow): AdminMember {
  const isFounder = profile.role === "founder";
  const founderPaymentVerified = isFounder
    ? Boolean(profile.founderProfile?.verifiedAt) || hasActivePaidSubscription(profile)
    : null;

  return {
    id: profile.id,
    email: profile.email,
    name: profile.fullName ?? profile.email.split("@")[0],
    role: profile.role,
    handle: profile.handle,
    trustScore: profile.trustScore,
    isVerified: profile.isVerified,
    founderPaymentVerified,
    suspended: Boolean(profile.suspendedAt),
    connectedAccounts: profile._count.socialAccounts,
    listingsCount: profile._count.tools,
    createdAt: profile.createdAt.toISOString().slice(0, 10),
    companyName: profile.founderProfile?.companyName ?? null,
    title: profile.founderProfile?.title ?? null
  };
}

export async function getAdminMembers() {
  const [users, founders, admins] = await Promise.all([
    prisma.profile.findMany({
      where: { role: { in: ["user", "creator", "moderator"] } },
      include: memberInclude,
      orderBy: { createdAt: "desc" }
    }),
    prisma.profile.findMany({
      where: { role: "founder" },
      include: memberInclude,
      orderBy: { createdAt: "desc" }
    }),
    prisma.profile.findMany({
      where: { role: "admin" },
      include: memberInclude,
      orderBy: { createdAt: "desc" }
    })
  ]);

  await Promise.all(founders.map((founder) => syncFounderPaymentVerification(founder.id)));

  const refreshedFounders = await prisma.profile.findMany({
    where: { role: "founder" },
    include: memberInclude,
    orderBy: { createdAt: "desc" }
  });

  return {
    users: users.map((profile) => mapProfileToAdminMember(profile as ProfileRow)),
    founders: refreshedFounders.map((profile) => mapProfileToAdminMember(profile as ProfileRow)),
    admins: admins.map((profile) => mapProfileToAdminMember(profile as ProfileRow))
  };
}
