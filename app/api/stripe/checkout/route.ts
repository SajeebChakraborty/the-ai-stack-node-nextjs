import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { checkoutSchema } from "@/lib/validation/schemas";
import { prisma } from "@/lib/db/prisma";
import { getPlan, getStripePriceId } from "@/lib/stripe/plans";
import { getStripe } from "@/lib/stripe/client";

export async function POST(request: Request) {
  const payload = checkoutSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  const plan = getPlan(payload.data.planId);
  const priceId = getStripePriceId(payload.data.planId, payload.data.interval);
  if (!plan || !priceId) {
    return NextResponse.json({ error: "Plan is not available." }, { status: 404 });
  }

  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: "Stripe checkout is not configured yet. Add STRIPE_SECRET_KEY to enable live billing." }, { status: 503 });
  }

  try {
    await prisma.profile.upsert({
      where: { externalAuthId: authUser.id },
      update: {
        email: authUser.email,
        fullName: authUser.name
      },
      create: {
        externalAuthId: authUser.id,
        email: authUser.email,
        fullName: authUser.name
      }
    });
  } catch {
    return NextResponse.json({ error: "MySQL database is not connected yet. Add DATABASE_URL to enable billing records." }, { status: 503 });
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: authUser.email,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    automatic_tax: { enabled: true },
    client_reference_id: authUser.id,
    subscription_data: {
      metadata: {
        user_id: authUser.id,
        plan_id: plan.id,
        interval: payload.data.interval
      }
    },
    success_url: `${appUrl}/founder/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancelled`
  });

  return NextResponse.json({ url: session.url });
}
