import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { prisma } from "@/lib/db/prisma";
import { mapPremiumPlanRow } from "@/lib/queries/plans";
import { buildPlanLimits } from "@/lib/plans/limits";
import { archivePremiumPlanInStripe, syncPremiumPlanToStripe } from "@/lib/stripe/sync-plan";
import { premiumPlanWriteSchema } from "@/lib/validation/schemas";

function resolvePlanLimits(
  data: { limits?: Record<string, number | string>; claimedListings?: number | "unlimited" },
  existing?: unknown
) {
  return buildPlanLimits({
    limits: {
      ...((existing && typeof existing === "object" && !Array.isArray(existing) ? (existing as Record<string, number | string>) : {}) ?? {}),
      ...(data.limits ?? {})
    },
    claimedListings: data.claimedListings
  });
}

type Context = {
  params: Promise<{ planId: string }>;
};

export async function PATCH(request: Request, context: Context) {
  const auth = await requireAdminApi();
  if (auth.error) {
    return auth.error;
  }

  const { planId } = await context.params;
  const payload = premiumPlanWriteSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.premiumPlan.findUnique({ where: { id: planId } });
  if (!existing) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  const data = payload.data;
  const merged = mapPremiumPlanRow({
    id: planId,
    name: data.name ?? existing.name,
    description: data.description ?? existing.description,
    monthlyPrice: data.monthlyPrice ?? existing.monthlyPrice,
    yearlyPrice: data.yearlyPrice ?? existing.yearlyPrice,
    badge: data.badge === undefined ? existing.badge : data.badge,
    features: data.features ?? existing.features,
    usageLimits: resolvePlanLimits(data, existing.usageLimits),
    stripeProductId: existing.stripeProductId,
    stripeMonthlyPriceId: existing.stripeMonthlyPriceId,
    stripeYearlyPriceId: existing.stripeYearlyPriceId,
    enabled: data.enabled ?? existing.enabled
  });

  let stripeIds = {
    stripeProductId: existing.stripeProductId,
    stripeMonthlyPriceId: existing.stripeMonthlyPriceId,
    stripeYearlyPriceId: existing.stripeYearlyPriceId
  };

  if (merged.monthlyPrice > 0 || merged.yearlyPrice > 0) {
    try {
      stripeIds = await syncPremiumPlanToStripe(merged);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? `Stripe sync failed: ${error.message}`
              : "Stripe sync failed. Check billing keys in Admin → Settings."
        },
        { status: 502 }
      );
    }
  } else {
    await archivePremiumPlanInStripe(merged);
    stripeIds = {
      stripeProductId: null,
      stripeMonthlyPriceId: null,
      stripeYearlyPriceId: null
    };
  }

  try {
    const row = await prisma.premiumPlan.update({
      where: { id: planId },
      data: {
        name: merged.name,
        description: merged.description,
        monthlyPrice: merged.monthlyPrice,
        yearlyPrice: merged.yearlyPrice,
        badge: merged.badge ?? null,
        features: merged.features,
        usageLimits: merged.limits,
        stripeProductId: stripeIds.stripeProductId,
        stripeMonthlyPriceId: stripeIds.stripeMonthlyPriceId,
        stripeYearlyPriceId: stripeIds.stripeYearlyPriceId,
        enabled: merged.enabled,
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {})
      }
    });

    return NextResponse.json({ plan: mapPremiumPlanRow(row) });
  } catch {
    return NextResponse.json({ error: "Could not update premium plan." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  const auth = await requireAdminApi();
  if (auth.error) {
    return auth.error;
  }

  const { planId } = await context.params;
  const existing = await prisma.premiumPlan.findUnique({ where: { id: planId } });
  if (!existing) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  const subscriptionCount = await prisma.subscription.count({ where: { planId } });
  if (subscriptionCount > 0) {
    const row = await prisma.premiumPlan.update({
      where: { id: planId },
      data: { enabled: false }
    });
    return NextResponse.json({
      plan: mapPremiumPlanRow(row),
      message: "Plan has active subscriptions and was disabled instead of deleted."
    });
  }

  const plan = mapPremiumPlanRow(existing);
  await archivePremiumPlanInStripe(plan);
  await prisma.premiumPlan.delete({ where: { id: planId } });

  return NextResponse.json({ deleted: true });
}
