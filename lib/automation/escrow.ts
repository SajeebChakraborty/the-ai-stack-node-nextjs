import "server-only";

import type Stripe from "stripe";
import { prisma } from "@/lib/db/prisma";
import { getStripe } from "@/lib/stripe/client";

type ReleaseOutcome =
  | { ok: true; alreadyReleased: boolean; transferId: string | null }
  | { ok: false; reason: string };

/**
 * Release escrowed funds to the seller's Stripe Connect account.
 * Idempotent — if the purchase is already released, just returns success.
 *
 * NOTE: caller is responsible for permission checks (admin, cron, or seller).
 */
export async function releaseAutomationFunds(purchaseId: string, resolverId?: string | null): Promise<ReleaseOutcome> {
  const purchase = await prisma.automationPurchase.findUnique({
    where: { id: purchaseId },
    include: {
      automation: { select: { ownerId: true, title: true } }
    }
  });

  if (!purchase) return { ok: false, reason: "not_found" };
  if (purchase.status === "released") {
    return { ok: true, alreadyReleased: true, transferId: purchase.releaseTransferId };
  }
  if (purchase.status === "refunded" || purchase.status === "cancelled") {
    return { ok: false, reason: "already_terminal" };
  }

  const sellerProfile = await prisma.profile.findUnique({
    where: { id: purchase.sellerId },
    select: { stripeAccountId: true, stripeAccountChargesEnabled: true, stripeAccountPayoutsEnabled: true }
  });

  const destinationAccount =
    purchase.sellerStripeAccountId ?? sellerProfile?.stripeAccountId ?? null;

  if (!destinationAccount) {
    return { ok: false, reason: "seller_no_connect_account" };
  }

  let transferId: string | null = null;

  // Skip the Stripe call when there's nothing to transfer (zero-cent fixtures / fully-refunded sellers).
  if (purchase.sellerEarningCents > 0) {
    let stripe: Stripe;
    try {
      stripe = await getStripe();
    } catch {
      return { ok: false, reason: "stripe_unavailable" };
    }

    try {
      const transfer = await stripe.transfers.create({
        amount: purchase.sellerEarningCents,
        currency: purchase.currency,
        destination: destinationAccount,
        description: `Automation sale: ${purchase.automation?.title ?? purchase.automationId}`,
        metadata: {
          kind: "automation_release",
          purchaseId: purchase.id,
          automationId: purchase.automationId,
          buyerId: purchase.buyerId,
          sellerId: purchase.sellerId
        },
        ...(purchase.stripePaymentIntentId
          ? { source_transaction: purchase.stripePaymentIntentId }
          : {})
      });
      transferId = transfer.id;
    } catch (error) {
      console.error("[automation/escrow] transfer failed", error);
      return { ok: false, reason: "transfer_failed" };
    }
  }

  await prisma.automationPurchase.update({
    where: { id: purchase.id },
    data: {
      status: "released",
      releasedAt: new Date(),
      releaseTransferId: transferId,
      sellerStripeAccountId: destinationAccount,
      ...(resolverId ? { resolvedById: resolverId, resolvedAt: new Date() } : {})
    }
  });

  return { ok: true, alreadyReleased: false, transferId };
}

/** Refund the buyer for an escrowed purchase. */
export async function refundAutomationPurchase(
  purchaseId: string,
  resolverId: string,
  notes?: string
): Promise<{ ok: true; refundId: string | null } | { ok: false; reason: string }> {
  const purchase = await prisma.automationPurchase.findUnique({ where: { id: purchaseId } });
  if (!purchase) return { ok: false, reason: "not_found" };
  if (purchase.status === "refunded") return { ok: true, refundId: null };
  if (purchase.status === "released") return { ok: false, reason: "already_released" };

  let refundId: string | null = null;

  if (purchase.stripePaymentIntentId) {
    try {
      const stripe = await getStripe();
      const refund = await stripe.refunds.create({
        payment_intent: purchase.stripePaymentIntentId,
        metadata: {
          kind: "automation_refund",
          purchaseId: purchase.id,
          resolverId
        }
      });
      refundId = refund.id;
    } catch (error) {
      console.error("[automation/escrow] refund failed", error);
      return { ok: false, reason: "refund_failed" };
    }
  }

  await prisma.automationPurchase.update({
    where: { id: purchase.id },
    data: {
      status: "refunded",
      resolvedById: resolverId,
      resolvedAt: new Date(),
      ...(notes ? { resolutionNotes: notes } : {})
    }
  });

  return { ok: true, refundId };
}

/**
 * Find all purchases that are past the auto-release window and release them.
 * Returns the IDs that were released this run.
 */
export async function processAutomationAutoReleases(now = new Date()): Promise<string[]> {
  const due = await prisma.automationPurchase.findMany({
    where: {
      status: "setup_confirmed",
      autoReleaseAt: { lte: now }
    },
    select: { id: true },
    take: 100
  });

  const released: string[] = [];
  for (const row of due) {
    const result = await releaseAutomationFunds(row.id, null);
    if (result.ok) released.push(row.id);
  }
  return released;
}
