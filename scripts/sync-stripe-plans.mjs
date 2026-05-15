/**
 * Creates Stripe products/prices for all paid plans and saves real ids to MySQL.
 * Usage: node --env-file=.env scripts/sync-stripe-plans.mjs
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

async function main() {
  const { PrismaClient } = require("@prisma/client");
  const Stripe = require("stripe").default;

  const databaseUrl = process.env.DATABASE_URL;
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing from .env");
  }

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is missing from .env (or save keys in Admin → Settings first).");
  }

  const prisma = new PrismaClient();
  const stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });

  const isRealPrice = (id) => /^price_[A-Za-z0-9]{14,}$/.test(id ?? "");
  const isRealProduct = (id) => /^prod_[A-Za-z0-9]{14,}$/.test(id ?? "");

  const plans = await prisma.premiumPlan.findMany({ orderBy: { sortOrder: "asc" } });
  console.log(`Found ${plans.length} plan(s) in database.`);

  for (const plan of plans) {
    if (Number(plan.monthlyPrice) <= 0 && Number(plan.yearlyPrice) <= 0) {
      console.log(`- ${plan.id}: free plan, skipped`);
      continue;
    }

    let productId = isRealProduct(plan.stripeProductId) ? plan.stripeProductId : null;

    if (productId) {
      try {
        await stripe.products.retrieve(productId);
        await stripe.products.update(productId, {
          name: plan.name,
          description: plan.description,
          metadata: { plan_id: plan.id }
        });
      } catch {
        productId = null;
      }
    }

    if (!productId) {
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: { plan_id: plan.id }
      });
      productId = product.id;
    }

    async function ensurePrice(existingId, amount, interval) {
      const cents = Math.round(Number(amount) * 100);
      if (cents <= 0) return null;

      if (isRealPrice(existingId)) {
        try {
          const existing = await stripe.prices.retrieve(existingId);
          const productRef = typeof existing.product === "string" ? existing.product : existing.product.id;
          if (
            existing.active &&
            existing.unit_amount === cents &&
            existing.recurring?.interval === interval &&
            productRef === productId
          ) {
            return existingId;
          }
          await stripe.prices.update(existingId, { active: false });
        } catch {
          // fall through
        }
      }

      const price = await stripe.prices.create({
        product: productId,
        currency: "usd",
        unit_amount: cents,
        recurring: { interval },
        metadata: { plan_id: plan.id, billing_interval: interval }
      });

      return price.id;
    }

    const monthlyId = await ensurePrice(plan.stripeMonthlyPriceId, plan.monthlyPrice, "month");
    const yearlyId = await ensurePrice(plan.stripeYearlyPriceId, plan.yearlyPrice, "year");

    await prisma.premiumPlan.update({
      where: { id: plan.id },
      data: {
        stripeProductId: productId,
        stripeMonthlyPriceId: monthlyId,
        stripeYearlyPriceId: yearlyId
      }
    });

    console.log(`- ${plan.id}: synced (${monthlyId}, ${yearlyId})`);
  }

  await prisma.$disconnect();
  console.log("Done. Refresh /pricing and try checkout again.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
