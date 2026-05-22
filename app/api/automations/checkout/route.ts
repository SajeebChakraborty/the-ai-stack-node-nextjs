import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import {
  calculateAutomationFees,
  getCourseMarketplaceSettings
} from "@/lib/marketplace/settings";
import { loadStripeSettings } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/client";

const checkoutSchema = z.object({
  automationId: z.string().optional(),
  slug: z.string().optional()
});

function formatError(error: unknown) {
  if (error instanceof Stripe.errors.StripeError) return error.message;
  if (error instanceof Error) return error.message;
  return "Could not start checkout.";
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to buy this automation." }, { status: 401 });
  }

  const parsed = checkoutSchema.safeParse(await request.json());
  if (!parsed.success || (!parsed.data.automationId && !parsed.data.slug)) {
    return NextResponse.json({ error: "Automation not provided." }, { status: 400 });
  }

  const automation = await prisma.automation.findFirst({
    where: {
      status: "published",
      ...(parsed.data.automationId ? { id: parsed.data.automationId } : { slug: parsed.data.slug })
    },
    select: {
      id: true,
      slug: true,
      title: true,
      shortDescription: true,
      thumbnailUrl: true,
      priceCents: true,
      currency: true,
      ownerId: true,
      owner: {
        select: {
          stripeAccountId: true,
          stripeAccountChargesEnabled: true
        }
      }
    }
  });

  if (!automation) {
    return NextResponse.json({ error: "Automation not found." }, { status: 404 });
  }

  if (automation.ownerId === user.id) {
    return NextResponse.json({ error: "You cannot buy your own automation." }, { status: 400 });
  }

  if (automation.priceCents <= 0) {
    return NextResponse.json({ error: "This automation is free." }, { status: 400 });
  }

  const existing = await prisma.automationPurchase.findFirst({
    where: {
      automationId: automation.id,
      buyerId: user.id,
      status: { in: ["paid_holding", "setup_confirmed", "released", "complained"] }
    },
    select: { id: true }
  });
  if (existing) {
    return NextResponse.json({ error: "You already own this automation." }, { status: 400 });
  }

  let stripe: Stripe;
  try {
    stripe = await getStripe();
  } catch {
    return NextResponse.json(
      { error: "Stripe is not configured yet. Ask the admin to add API keys." },
      { status: 503 }
    );
  }

  const marketplace = await getCourseMarketplaceSettings();
  const fees = calculateAutomationFees(
    automation.priceCents,
    marketplace.automationBuyerFeePercent,
    marketplace.automationSellerFeePercent
  );

  const billingSettings = await loadStripeSettings();
  const useAutomaticTax = process.env.STRIPE_AUTOMATIC_TAX === "true";
  const _defaultTaxRateId = billingSettings.defaultTaxRateId.startsWith("txr_")
    ? billingSettings.defaultTaxRateId
    : null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

  // Funds stay on the platform until escrow release. No transfer_data / application_fee.
  try {
    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
      quantity: 1,
      price_data: {
        currency: automation.currency || marketplace.currency,
        unit_amount: fees.amountCents,
        product_data: {
          name: automation.title,
          description: automation.shortDescription,
          ...(automation.thumbnailUrl ? { images: [automation.thumbnailUrl] } : {})
        }
      }
    };

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [lineItem],
      allow_promotion_codes: false,
      metadata: {
        kind: "automation_purchase",
        automationId: automation.id,
        buyerId: user.id,
        sellerId: automation.ownerId,
        sellerStripeAccountId: automation.owner?.stripeAccountId ?? "",
        basePriceCents: String(fees.basePriceCents),
        buyerFeeCents: String(fees.buyerFeeCents),
        sellerFeeCents: String(fees.sellerFeeCents),
        sellerEarningCents: String(fees.sellerEarningCents),
        platformTotalCents: String(fees.platformTotalCents)
      },
      payment_intent_data: {
        metadata: {
          kind: "automation_purchase",
          automationId: automation.id,
          buyerId: user.id,
          sellerId: automation.ownerId
        }
      },
      ...(useAutomaticTax ? { automatic_tax: { enabled: true } } : {}),
      success_url: `${appUrl}/automations/${automation.slug}?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/automations/${automation.slug}?purchase=cancelled`
    };

    const session = await stripe.checkout.sessions.create(params);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[automations/checkout]", formatError(error));
    return NextResponse.json({ error: formatError(error) }, { status: 400 });
  }
}
