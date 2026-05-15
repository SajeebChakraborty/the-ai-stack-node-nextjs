import "server-only";

import { prisma } from "@/lib/db/prisma";
import { syncFounderPaymentVerification } from "@/lib/founders/verification";
import { getStripe } from "@/lib/stripe/client";

export async function syncSubscriptionFromCheckoutSession(sessionId: string, expectedUserId: string) {
  const stripe = await getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"]
  });

  if (session.client_reference_id && session.client_reference_id !== expectedUserId) {
    throw new Error("CHECKOUT_SESSION_USER_MISMATCH");
  }

  const userId = session.client_reference_id ?? expectedUserId;
  const subscriptionRef = session.subscription;
  const subscriptionId = typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

  if (!subscriptionId || !customerId) {
    return { synced: false, verified: false };
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  const planId = stripeSubscription.metadata.plan_id ?? "starter";

  await prisma.profile.upsert({
    where: { id: userId },
    update: { role: "founder" },
    create: {
      id: userId,
      email: session.customer_email ?? `${userId}@stripe.local`,
      role: "founder"
    }
  });

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscriptionId },
    update: {
      userId,
      stripeCustomerId: customerId,
      planId,
      status: stripeSubscription.status,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
    },
    create: {
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      planId,
      status: stripeSubscription.status,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
    }
  });

  const verified = await syncFounderPaymentVerification(userId);

  return { synced: true, verified, planId };
}
