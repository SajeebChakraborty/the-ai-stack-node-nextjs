import "server-only";

import { prisma } from "@/lib/db/prisma";
import { ensurePremiumPlansSeeded, listAdminPremiumPlans, mapPremiumPlanRow } from "@/lib/queries/plans";
import { isRealStripePriceId, isRealStripeProductId } from "@/lib/stripe/ids";
import { syncPremiumPlanToStripe } from "@/lib/stripe/sync-plan";

export async function clearPlaceholderStripeIds() {
  const rows = await prisma.premiumPlan.findMany();

  for (const row of rows) {
    const stripeProductId = isRealStripeProductId(row.stripeProductId) ? row.stripeProductId : null;
    const stripeMonthlyPriceId = isRealStripePriceId(row.stripeMonthlyPriceId) ? row.stripeMonthlyPriceId : null;
    const stripeYearlyPriceId = isRealStripePriceId(row.stripeYearlyPriceId) ? row.stripeYearlyPriceId : null;

    if (
      stripeProductId !== row.stripeProductId ||
      stripeMonthlyPriceId !== row.stripeMonthlyPriceId ||
      stripeYearlyPriceId !== row.stripeYearlyPriceId
    ) {
      await prisma.premiumPlan.update({
        where: { id: row.id },
        data: {
          stripeProductId,
          stripeMonthlyPriceId,
          stripeYearlyPriceId
        }
      });
    }
  }
}

export async function syncAllPremiumPlansToStripe() {
  await ensurePremiumPlansSeeded();
  await clearPlaceholderStripeIds();

  const plans = await listAdminPremiumPlans();
  const synced = [];

  for (const plan of plans) {
    if (plan.monthlyPrice <= 0 && plan.yearlyPrice <= 0) {
      continue;
    }

    const stripeIds = await syncPremiumPlanToStripe(plan);
    const row = await prisma.premiumPlan.update({
      where: { id: plan.id },
      data: {
        stripeProductId: stripeIds.stripeProductId,
        stripeMonthlyPriceId: stripeIds.stripeMonthlyPriceId,
        stripeYearlyPriceId: stripeIds.stripeYearlyPriceId
      }
    });

    synced.push(mapPremiumPlanRow(row));
  }

  return synced;
}
