import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db/prisma";
import { syncFounderPaymentVerification } from "@/lib/founders/verification";
import { loadStripeSettings } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/client";

export const runtime = "nodejs";

async function syncFounderVerificationForSubscription(stripeSubscriptionId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
    select: { userId: true }
  });

  if (subscription?.userId) {
    await syncFounderPaymentVerification(subscription.userId);
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");
  const { webhookSecret } = await loadStripeSettings();

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook signature configuration missing." }, { status: 400 });
  }

  let event: Stripe.Event;
  let stripe: Awaited<ReturnType<typeof getStripe>>;
  try {
    stripe = await getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

    // Course purchase (one-time) flow — runs alongside subscription handling.
    if (session.metadata?.kind === "course_purchase" && session.metadata.courseId && session.metadata.buyerId) {
      const courseId = session.metadata.courseId;
      const buyerId = session.metadata.buyerId;
      const platformFeeCents = Number(session.metadata.platformFeeCents ?? "0");
      const creatorEarningCents = Number(session.metadata.creatorEarningCents ?? "0");
      const amountCents = session.amount_total ?? 0;
      const currency = (session.currency ?? "usd").toLowerCase();
      const paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;

      try {
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          select: { id: true, ownerId: true, owner: { select: { stripeAccountId: true } } }
        });

        if (course) {
          await prisma.coursePurchase.upsert({
            where: { stripeSessionId: session.id },
            update: {
              amountCents,
              platformFeeCents,
              creatorEarningCents,
              currency,
              stripePaymentIntentId: paymentIntentId,
              stripeAccountId: course.owner?.stripeAccountId ?? null
            },
            create: {
              courseId,
              buyerId,
              amountCents,
              platformFeeCents,
              creatorEarningCents,
              currency,
              stripeSessionId: session.id,
              stripePaymentIntentId: paymentIntentId,
              stripeAccountId: course.owner?.stripeAccountId ?? null
            }
          });

          // Enroll the buyer (idempotent).
          await prisma.courseEnrollment.upsert({
            where: { userId_courseId: { userId: buyerId, courseId } },
            update: {},
            create: { userId: buyerId, courseId }
          });
        }
      } catch (error) {
        console.error("[stripe/webhook] course_purchase", error);
      }
    }

    // Automation purchase (escrow flow) — funds remain on the platform.
    if (
      session.metadata?.kind === "automation_purchase" &&
      session.metadata.automationId &&
      session.metadata.buyerId &&
      session.metadata.sellerId
    ) {
      const automationId = session.metadata.automationId;
      const buyerId = session.metadata.buyerId;
      const sellerId = session.metadata.sellerId;
      const sellerStripeAccountId = session.metadata.sellerStripeAccountId || null;
      const basePriceCents = Number(session.metadata.basePriceCents ?? "0");
      const buyerFeeCents = Number(session.metadata.buyerFeeCents ?? "0");
      const sellerFeeCents = Number(session.metadata.sellerFeeCents ?? "0");
      const sellerEarningCents = Number(session.metadata.sellerEarningCents ?? "0");
      const platformTotalCents = Number(session.metadata.platformTotalCents ?? "0");
      const amountCents = session.amount_total ?? basePriceCents + buyerFeeCents;
      const currency = (session.currency ?? "usd").toLowerCase();
      const paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;

      try {
        await prisma.automationPurchase.upsert({
          where: { stripeSessionId: session.id },
          update: {
            amountCents,
            basePriceCents,
            buyerFeeCents,
            sellerFeeCents,
            sellerEarningCents,
            platformTotalCents,
            currency,
            stripePaymentIntentId: paymentIntentId,
            sellerStripeAccountId
          },
          create: {
            automationId,
            buyerId,
            sellerId,
            amountCents,
            basePriceCents,
            buyerFeeCents,
            sellerFeeCents,
            sellerEarningCents,
            platformTotalCents,
            currency,
            status: "paid_holding",
            stripeSessionId: session.id,
            stripePaymentIntentId: paymentIntentId,
            sellerStripeAccountId
          }
        });
      } catch (error) {
        console.error("[stripe/webhook] automation_purchase", error);
      }
    }

    if (userId && subscriptionId && customerId) {
      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      const planId = stripeSubscription.metadata.plan_id ?? "starter";

      await prisma.profile.upsert({
        where: { id: userId },
        update: {
          role: "founder"
        },
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

      await syncFounderPaymentVerification(userId);
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    await prisma.subscription.updateMany({
      where: {
        stripeSubscriptionId: subscription.id
      },
      data: {
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });

    await syncFounderVerificationForSubscription(subscription.id);
  }

  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;
    try {
      await prisma.profile.updateMany({
        where: { stripeAccountId: account.id },
        data: {
          stripeAccountDetailsSubmitted: Boolean(account.details_submitted),
          stripeAccountChargesEnabled: Boolean(account.charges_enabled),
          stripeAccountPayoutsEnabled: Boolean(account.payouts_enabled)
        }
      });
    } catch (error) {
      console.error("[stripe/webhook] account.updated", error);
    }
  }

  if (event.type === "invoice.payment_failed" || event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    const invoiceSubscriptionId =
      typeof (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }).subscription === "string"
        ? (invoice as Stripe.Invoice & { subscription?: string }).subscription
        : undefined;
    const subscription = invoiceSubscriptionId
      ? await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: invoiceSubscriptionId },
          select: { id: true, userId: true }
        })
      : null;

    await prisma.payment.upsert({
      where: { stripeInvoiceId: invoice.id },
      update: {
        amountDue: invoice.amount_due,
        amountPaid: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf
      },
      create: {
        subscriptionId: subscription?.id,
        stripeInvoiceId: invoice.id,
        stripeCustomerId: typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id,
        amountDue: invoice.amount_due,
        amountPaid: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf
      }
    });

    if (subscription?.userId) {
      await syncFounderPaymentVerification(subscription.userId);
    }
  }

  return NextResponse.json({ received: true });
}
