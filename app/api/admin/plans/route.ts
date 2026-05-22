import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { prisma } from "@/lib/db/prisma";
import { listAdminPremiumPlans, mapPremiumPlanRow } from "@/lib/queries/plans";
import { buildPlanLimits } from "@/lib/plans/limits";
import { syncPremiumPlanToStripe } from "@/lib/stripe/sync-plan";
import { premiumPlanWriteSchema } from "@/lib/validation/schemas";

function resolvePlanLimits(
  data: {
    limits?: Record<string, number | string>;
    claimedListings?: number | "unlimited";
    directoryPriorityDays?: number;
  },
  existing?: unknown
) {
  return buildPlanLimits({
    limits: {
      ...((existing && typeof existing === "object" && !Array.isArray(existing) ? (existing as Record<string, number | string>) : {}) ?? {}),
      ...(data.limits ?? {})
    },
    claimedListings: data.claimedListings,
    directoryPriorityDays: data.directoryPriorityDays
  });
}

function slugifyId(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || `plan-${Date.now()}`;
}

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) {
    return auth.error;
  }

  try {
    const plans = await listAdminPremiumPlans();
    return NextResponse.json({ plans });
  } catch {
    return NextResponse.json({ error: "Could not load premium plans." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth.error) {
    return auth.error;
  }

  const payload = premiumPlanWriteSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  const data = payload.data;
  const planId = data.id ?? slugifyId(data.name);

  try {
    const existing = await prisma.premiumPlan.findUnique({ where: { id: planId } });
    if (existing) {
      return NextResponse.json({ error: "A plan with this id already exists." }, { status: 409 });
    }

    const sortOrder =
      data.sortOrder ??
      (await prisma.premiumPlan.count());

    const draft = mapPremiumPlanRow({
      id: planId,
      name: data.name,
      description: data.description,
      monthlyPrice: data.monthlyPrice,
      yearlyPrice: data.yearlyPrice,
      badge: data.badge ?? null,
      features: data.features,
      usageLimits: resolvePlanLimits(data),
      stripeProductId: null,
      stripeMonthlyPriceId: null,
      stripeYearlyPriceId: null,
      enabled: data.enabled ?? true
    });

    let stripeIds = {
      stripeProductId: null as string | null,
      stripeMonthlyPriceId: null as string | null,
      stripeYearlyPriceId: null as string | null
    };

    if (draft.monthlyPrice > 0 || draft.yearlyPrice > 0) {
      try {
        stripeIds = await syncPremiumPlanToStripe(draft);
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
    }

    const row = await prisma.premiumPlan.create({
      data: {
        id: planId,
        name: data.name,
        description: data.description,
        monthlyPrice: data.monthlyPrice,
        yearlyPrice: data.yearlyPrice,
        badge: data.badge ?? null,
        features: data.features,
        usageLimits: resolvePlanLimits(data),
        stripeProductId: stripeIds.stripeProductId,
        stripeMonthlyPriceId: stripeIds.stripeMonthlyPriceId,
        stripeYearlyPriceId: stripeIds.stripeYearlyPriceId,
        sortOrder,
        enabled: data.enabled ?? true
      }
    });

    return NextResponse.json({ plan: mapPremiumPlanRow(row) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create premium plan." }, { status: 503 });
  }
}
