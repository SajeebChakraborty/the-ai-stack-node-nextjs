import "server-only";

import type Stripe from "stripe";
import type { PremiumPlan } from "@/types/domain";
import { getStripe } from "@/lib/stripe/client";
import { isRealStripePriceId, isRealStripeProductId } from "@/lib/stripe/ids";

function amountInCents(amount: number) {
  return Math.round(amount * 100);
}

async function resolveProduct(
  stripe: Stripe,
  plan: Pick<PremiumPlan, "id" | "name" | "description" | "stripeProductId">
) {
  let productId = isRealStripeProductId(plan.stripeProductId) ? plan.stripeProductId : null;

  if (productId) {
    try {
      await stripe.products.retrieve(productId);
      await stripe.products.update(productId, {
        name: plan.name,
        description: plan.description,
        metadata: { plan_id: plan.id }
      });
      return productId;
    } catch {
      productId = null;
    }
  }

  const product = await stripe.products.create({
    name: plan.name,
    description: plan.description,
    metadata: { plan_id: plan.id }
  });

  return product.id;
}

async function resolvePrice(
  stripe: Stripe,
  input: {
    productId: string;
    planId: string;
    existingPriceId: string | null | undefined;
    amount: number;
    interval: "month" | "year";
  }
) {
  if (input.amount <= 0) {
    return null;
  }

  const cents = amountInCents(input.amount);
  const existingId = isRealStripePriceId(input.existingPriceId) ? input.existingPriceId : null;

  if (existingId) {
    try {
      const existing = await stripe.prices.retrieve(existingId);
      const matches =
        existing.active &&
        existing.unit_amount === cents &&
        existing.recurring?.interval === input.interval &&
        (typeof existing.product === "string" ? existing.product : existing.product.id) === input.productId;

      if (matches) {
        return existingId;
      }

      await stripe.prices.update(existingId, { active: false });
    } catch {
      // Create a fresh price below.
    }
  }

  const price = await stripe.prices.create({
    product: input.productId,
    currency: "usd",
    unit_amount: cents,
    recurring: { interval: input.interval },
    metadata: {
      plan_id: input.planId,
      billing_interval: input.interval
    }
  });

  return price.id;
}

export async function syncPremiumPlanToStripe(plan: PremiumPlan) {
  if (plan.monthlyPrice <= 0 && plan.yearlyPrice <= 0) {
    return {
      stripeProductId: null as string | null,
      stripeMonthlyPriceId: null as string | null,
      stripeYearlyPriceId: null as string | null
    };
  }

  const stripe = await getStripe();
  const productId = await resolveProduct(stripe, plan);
  const stripeMonthlyPriceId = await resolvePrice(stripe, {
    productId,
    planId: plan.id,
    existingPriceId: plan.stripeMonthlyPriceId,
    amount: plan.monthlyPrice,
    interval: "month"
  });
  const stripeYearlyPriceId = await resolvePrice(stripe, {
    productId,
    planId: plan.id,
    existingPriceId: plan.stripeYearlyPriceId,
    amount: plan.yearlyPrice,
    interval: "year"
  });

  return {
    stripeProductId: productId,
    stripeMonthlyPriceId,
    stripeYearlyPriceId
  };
}

export async function archivePremiumPlanInStripe(plan: Pick<PremiumPlan, "stripeProductId" | "stripeMonthlyPriceId" | "stripeYearlyPriceId">) {
  try {
    const stripe = await getStripe();

    if (isRealStripePriceId(plan.stripeMonthlyPriceId)) {
      await stripe.prices.update(plan.stripeMonthlyPriceId, { active: false });
    }

    if (isRealStripePriceId(plan.stripeYearlyPriceId)) {
      await stripe.prices.update(plan.stripeYearlyPriceId, { active: false });
    }

    if (isRealStripeProductId(plan.stripeProductId)) {
      await stripe.products.update(plan.stripeProductId, { active: false });
    }
  } catch {
    // Stripe may already be removed; ignore cleanup errors.
  }
}
