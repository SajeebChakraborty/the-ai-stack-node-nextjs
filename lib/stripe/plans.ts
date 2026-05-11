import { premiumPlans } from "@/data/catalog";

export function getPlan(planId: string) {
  return premiumPlans.find((plan) => plan.id === planId && plan.enabled);
}

export function getStripePriceId(planId: string, interval: "monthly" | "yearly") {
  const plan = getPlan(planId);
  if (!plan) return null;
  return interval === "monthly" ? plan.stripeMonthlyPriceId : plan.stripeYearlyPriceId;
}
