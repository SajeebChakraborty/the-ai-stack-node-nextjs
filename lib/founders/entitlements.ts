import "server-only";

import type { Role } from "@/types/domain";
import { prisma } from "@/lib/db/prisma";
import { isFounderPaymentVerified } from "@/lib/founders/verification";

const activeStatuses = ["active", "trialing"] as const;

export type FounderEntitlements = {
  verified: boolean;
  planId: string | null;
  planName: string | null;
  claimLimit: number | null;
  claimsUsed: number;
  canClaimMore: boolean;
};

import { parseClaimLimitFromLimits } from "@/lib/plans/limits";

export async function countFounderClaims(userId: string) {
  return prisma.tool.count({
    where: { founderId: userId }
  });
}

export async function getFounderActivePlan(userId: string) {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: [...activeStatuses] }
    },
    orderBy: { createdAt: "desc" },
    include: {
      plan: {
        select: {
          id: true,
          name: true,
          monthlyPrice: true,
          usageLimits: true
        }
      }
    }
  });
}

export async function getFounderEntitlements(userId: string, role: Role): Promise<FounderEntitlements> {
  const [verified, claimsUsed, subscription] = await Promise.all([
    isFounderPaymentVerified(userId, role),
    countFounderClaims(userId),
    getFounderActivePlan(userId)
  ]);

  if (!subscription?.plan) {
    return {
      verified,
      planId: null,
      planName: null,
      claimLimit: verified ? 0 : 0,
      claimsUsed,
      canClaimMore: false
    };
  }

  const claimLimit = parseClaimLimitFromLimits(subscription.plan.usageLimits);
  const canClaimMore = verified && (claimLimit === null || claimsUsed < claimLimit);

  return {
    verified,
    planId: subscription.plan.id,
    planName: subscription.plan.name,
    claimLimit,
    claimsUsed,
    canClaimMore
  };
}

export async function assertFounderCanClaim(userId: string, role: Role) {
  const entitlements = await getFounderEntitlements(userId, role);

  if (!entitlements.verified) {
    return {
      ok: false as const,
      status: 403,
      code: "NOT_VERIFIED",
      error: "Complete a founder plan payment to become verified before claiming listings."
    };
  }

  if (entitlements.claimLimit === null) {
    return { ok: true as const, entitlements };
  }

  if (entitlements.claimsUsed >= entitlements.claimLimit) {
    return {
      ok: false as const,
      status: 403,
      code: "CLAIM_LIMIT_REACHED",
      error: `Your ${entitlements.planName ?? "current"} plan includes ${entitlements.claimLimit} claimed listing${entitlements.claimLimit === 1 ? "" : "s"}. Upgrade to claim more.`,
      entitlements
    };
  }

  return { ok: true as const, entitlements };
}
