import { prisma } from "@/lib/db/prisma";
import { premiumPlans as defaultPremiumPlans } from "@/data/catalog";
import type { PremiumPlan } from "@/types/domain";
import { toNumber } from "@/lib/queries/admin-metrics";
import { normalizeStripeId } from "@/lib/stripe/ids";

export function mapPremiumPlanRow(plan: {
  id: string;
  name: string;
  description: string;
  monthlyPrice: unknown;
  yearlyPrice: unknown;
  badge: string | null;
  features: unknown;
  usageLimits: unknown;
  stripeProductId: string | null;
  stripeMonthlyPriceId: string | null;
  stripeYearlyPriceId: string | null;
  enabled: boolean;
}): PremiumPlan {
  const features = Array.isArray(plan.features) ? (plan.features as string[]) : [];
  const limits =
    plan.usageLimits && typeof plan.usageLimits === "object" && !Array.isArray(plan.usageLimits)
      ? (plan.usageLimits as Record<string, number | string>)
      : {};

  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    monthlyPrice: toNumber(plan.monthlyPrice),
    yearlyPrice: toNumber(plan.yearlyPrice),
    badge: (plan.badge as PremiumPlan["badge"]) ?? undefined,
    features,
    limits,
    stripeProductId: normalizeStripeId(plan.stripeProductId, "product"),
    stripeMonthlyPriceId: normalizeStripeId(plan.stripeMonthlyPriceId, "price"),
    stripeYearlyPriceId: normalizeStripeId(plan.stripeYearlyPriceId, "price"),
    enabled: plan.enabled
  };
}

export async function ensurePremiumPlansSeeded() {
  const count = await prisma.premiumPlan.count();
  if (count > 0) {
    return;
  }

  await Promise.all(
    defaultPremiumPlans.map((plan, index) =>
      prisma.premiumPlan.upsert({
        where: { id: plan.id },
        update: {},
        create: {
          id: plan.id,
          name: plan.name,
          description: plan.description,
          monthlyPrice: plan.monthlyPrice,
          yearlyPrice: plan.yearlyPrice,
          badge: plan.badge ?? null,
          features: plan.features,
          usageLimits: plan.limits,
          stripeProductId: null,
          stripeMonthlyPriceId: null,
          stripeYearlyPriceId: null,
          sortOrder: index,
          enabled: plan.enabled
        }
      })
    )
  );
}

export async function getPublishedPremiumPlans() {
  await ensurePremiumPlansSeeded();

  const rows = await prisma.premiumPlan.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: "asc" }
  });

  return rows.map(mapPremiumPlanRow);
}

export async function getPremiumPlanById(planId: string) {
  const row = await prisma.premiumPlan.findUnique({
    where: { id: planId }
  });

  if (!row || !row.enabled) {
    return null;
  }

  return mapPremiumPlanRow(row);
}

export async function listAdminPremiumPlans() {
  await ensurePremiumPlansSeeded();

  const rows = await prisma.premiumPlan.findMany({
    orderBy: { sortOrder: "asc" }
  });

  return rows.map(mapPremiumPlanRow);
}
