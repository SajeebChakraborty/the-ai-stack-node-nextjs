import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getCurrentUser } from "@/lib/auth/session";
import { checkoutSchema } from "@/lib/validation/schemas";
import { prisma } from "@/lib/db/prisma";
import { loadStripeSettings } from "@/lib/stripe/config";
import { getPlan, getStripePriceId } from "@/lib/stripe/plans";
import { getStripe } from "@/lib/stripe/client";

function formatCheckoutError(error: unknown) {
  if (error instanceof Stripe.errors.StripeError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Checkout could not be started.";
}

export async function POST(request: Request) {
  const payload = checkoutSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  const plan = await getPlan(payload.data.planId);
  const priceId = await getStripePriceId(payload.data.planId, payload.data.interval);
  if (!plan || !priceId) {
    return NextResponse.json(
      {
        error:
          "This plan is not ready for checkout. Open Admin → Plans and click “Sync all to Stripe”, or edit the plan and save again."
      },
      { status: 404 }
    );
  }

  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let stripe: Stripe;
  try {
    stripe = await getStripe();
  } catch {
    return NextResponse.json(
      { error: "Stripe checkout is not configured yet. Add keys in Admin → Settings → Stripe billing." },
      { status: 503 }
    );
  }

  try {
    await prisma.profile.upsert({
      where: { id: authUser.id },
      update: {
        email: authUser.email,
        fullName: authUser.name,
        role: authUser.role === "admin" ? "admin" : "founder"
      },
      create: {
        id: authUser.id,
        email: authUser.email,
        fullName: authUser.name,
        role: "founder"
      }
    });
  } catch {
    return NextResponse.json({ error: "MySQL database is not connected yet. Add DATABASE_URL to enable billing records." }, { status: 503 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const billingSettings = await loadStripeSettings();
  const useAutomaticTax = process.env.STRIPE_AUTOMATIC_TAX === "true";
  const defaultTaxRateId = billingSettings.defaultTaxRateId.startsWith("txr_")
    ? billingSettings.defaultTaxRateId
    : null;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: authUser.email,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      ...(useAutomaticTax ? { automatic_tax: { enabled: true } } : {}),
      client_reference_id: authUser.id,
      subscription_data: {
        metadata: {
          user_id: authUser.id,
          plan_id: plan.id,
          interval: payload.data.interval
        },
        ...(defaultTaxRateId && !useAutomaticTax ? { default_tax_rates: [defaultTaxRateId] } : {})
      },
      success_url: `${appUrl}/user/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[stripe/checkout]", formatCheckoutError(error));
    return NextResponse.json({ error: formatCheckoutError(error) }, { status: 400 });
  }
}
