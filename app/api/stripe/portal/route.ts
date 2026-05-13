import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getStripe } from "@/lib/stripe/client";

export async function POST(request: Request) {
  const authUser = await getCurrentUser();

  if (!authUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let subscription: { stripeCustomerId: string } | null;
  try {
    subscription = await prisma.subscription.findFirst({
      where: {
        userId: authUser.id
      },
      orderBy: {
        createdAt: "desc"
      },
      select: {
        stripeCustomerId: true
      }
    });
  } catch {
    return NextResponse.json({ error: "MySQL database is not connected yet. Add DATABASE_URL to enable billing portal records." }, { status: 503 });
  }

  const customerId = subscription?.stripeCustomerId;
  if (!customerId) {
    return NextResponse.json({ error: "No Stripe customer is attached to this account." }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: "Stripe is not configured yet. Add STRIPE_SECRET_KEY to enable the billing portal." }, { status: 503 });
  }
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/founder/dashboard`
  });

  return NextResponse.json({ url: portal.url });
}
