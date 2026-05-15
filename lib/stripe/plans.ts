import { getPremiumPlanById } from "@/lib/queries/plans";
import { isRealStripePriceId } from "@/lib/stripe/ids";

export async function getPlan(planId: string) {
  return getPremiumPlanById(planId);
}

export async function getStripePriceId(planId: string, interval: "monthly" | "yearly") {
  const plan = await getPlan(planId);
  if (!plan) {
    return null;
  }

  const priceId = interval === "monthly" ? plan.stripeMonthlyPriceId : plan.stripeYearlyPriceId;
  return isRealStripePriceId(priceId) ? priceId : null;
}
