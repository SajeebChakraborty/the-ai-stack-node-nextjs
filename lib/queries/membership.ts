import "server-only";

import { getFounderActivePlan } from "@/lib/founders/entitlements";
import { getPublishedPremiumPlans } from "@/lib/queries/plans";
import { toNumber } from "@/lib/queries/admin-metrics";
import { prisma } from "@/lib/db/prisma";
import type { PremiumPlan } from "@/types/domain";

export type MembershipBookmark = {
  toolId: string;
  slug: string;
  name: string;
  tagline: string;
  logoUrl: string | null;
  bookmarkedAt: string;
};

export type MembershipCurrentPlan = {
  id: string;
  name: string;
  monthlyPrice: number;
  description: string;
  subscriptionStatus: string | null;
};

export type MembershipSummary = {
  bookmarks: MembershipBookmark[];
  currentPlan: MembershipCurrentPlan;
  upgradePlans: PremiumPlan[];
};

export async function getUserBookmarks(userId: string): Promise<MembershipBookmark[]> {
  const rows = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      toolId: true,
      createdAt: true,
      tool: {
        select: {
          slug: true,
          name: true,
          tagline: true,
          logoUrl: true
        }
      }
    }
  });

  return rows.map((row) => ({
    toolId: row.toolId,
    slug: row.tool.slug,
    name: row.tool.name,
    tagline: row.tool.tagline,
    logoUrl: row.tool.logoUrl,
    bookmarkedAt: row.createdAt.toISOString()
  }));
}

export async function getUserMembershipSummary(userId: string): Promise<MembershipSummary> {
  const [bookmarks, subscription, publishedPlans] = await Promise.all([
    getUserBookmarks(userId),
    getFounderActivePlan(userId),
    getPublishedPremiumPlans()
  ]);

  const freePlan = publishedPlans.find((plan) => plan.id === "free");
  const matchedPublishedPlan = subscription?.plan
    ? publishedPlans.find((plan) => plan.id === subscription.plan.id)
    : freePlan;

  const currentPlan: MembershipCurrentPlan = subscription?.plan
    ? {
        id: subscription.plan.id,
        name: subscription.plan.name,
        monthlyPrice: toNumber(subscription.plan.monthlyPrice),
        description: matchedPublishedPlan?.description ?? "",
        subscriptionStatus: subscription.status
      }
    : {
        id: freePlan?.id ?? "free",
        name: freePlan?.name ?? "Free",
        monthlyPrice: freePlan?.monthlyPrice ?? 0,
        description: freePlan?.description ?? "Explore the directory and save bookmarks.",
        subscriptionStatus: null
      };

  const upgradePlans = publishedPlans.filter(
    (plan) => plan.enabled && plan.id !== currentPlan.id && plan.monthlyPrice > currentPlan.monthlyPrice
  );

  return {
    bookmarks,
    currentPlan,
    upgradePlans
  };
}
