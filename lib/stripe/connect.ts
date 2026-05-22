import "server-only";

import type Stripe from "stripe";
import { prisma } from "@/lib/db/prisma";
import { getStripe } from "@/lib/stripe/client";

export type ConnectAccountStatus = {
  hasAccount: boolean;
  accountId: string | null;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  /** True only when the account can both receive funds and trigger payouts. */
  ready: boolean;
  /** Stripe `requirements.currently_due` array (truncated, for UI hints). */
  requirementsDue: string[];
};

function resolveAppUrl(requestOrigin?: string) {
  return process.env.NEXT_PUBLIC_APP_URL ?? requestOrigin ?? "http://localhost:3000";
}

async function persistConnectStatus(userId: string, account: Stripe.Account) {
  await prisma.profile.update({
    where: { id: userId },
    data: {
      stripeAccountId: account.id,
      stripeAccountDetailsSubmitted: Boolean(account.details_submitted),
      stripeAccountChargesEnabled: Boolean(account.charges_enabled),
      stripeAccountPayoutsEnabled: Boolean(account.payouts_enabled)
    }
  });
}

/**
 * Get-or-create a Stripe Express Connect account for the given user.
 *
 * The account id is stored on the user's Profile row so subsequent calls reuse it.
 */
export async function getOrCreateConnectAccount(userId: string, email: string): Promise<string> {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { stripeAccountId: true }
  });

  if (profile?.stripeAccountId) {
    return profile.stripeAccountId;
  }

  const stripe = await getStripe();
  const account = await stripe.accounts.create({
    type: "express",
    email,
    capabilities: {
      transfers: { requested: true },
      card_payments: { requested: true }
    },
    metadata: { user_id: userId }
  });

  await persistConnectStatus(userId, account);
  return account.id;
}

/**
 * Refresh the cached status for a Connect account (called from onboarding return + webhook).
 */
export async function refreshConnectAccountStatus(userId: string): Promise<ConnectAccountStatus> {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { stripeAccountId: true }
  });

  if (!profile?.stripeAccountId) {
    return {
      hasAccount: false,
      accountId: null,
      detailsSubmitted: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      ready: false,
      requirementsDue: []
    };
  }

  const stripe = await getStripe();
  const account = await stripe.accounts.retrieve(profile.stripeAccountId);
  await persistConnectStatus(userId, account);

  return {
    hasAccount: true,
    accountId: account.id,
    detailsSubmitted: Boolean(account.details_submitted),
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
    ready: Boolean(account.charges_enabled && account.payouts_enabled),
    requirementsDue: (account.requirements?.currently_due ?? []).slice(0, 10)
  };
}

/**
 * Build a one-time Stripe-hosted onboarding link for the user's Express account.
 *
 * Stripe shows the form embedded in their UI; on completion they redirect to
 * the `return_url`, where we re-check status.
 */
export async function createConnectOnboardingLink(
  userId: string,
  email: string,
  requestOrigin?: string
): Promise<string> {
  const stripe = await getStripe();
  const accountId = await getOrCreateConnectAccount(userId, email);
  const baseUrl = resolveAppUrl(requestOrigin);

  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${baseUrl}/user/wallet?connect=refresh`,
    return_url: `${baseUrl}/user/wallet?connect=return`
  });

  return link.url;
}

/**
 * Build a one-time link to the Stripe-hosted Express dashboard
 * (creators can manage their bank, tax info, payouts, etc.).
 */
export async function createConnectLoginLink(accountId: string): Promise<string> {
  const stripe = await getStripe();
  const link = await stripe.accounts.createLoginLink(accountId);
  return link.url;
}

export async function getConnectBalance(accountId: string) {
  const stripe = await getStripe();
  const balance = await stripe.balance.retrieve({ stripeAccount: accountId });
  return balance;
}

export async function createConnectPayout(
  accountId: string,
  amountCents: number,
  currency: string
) {
  const stripe = await getStripe();
  return stripe.payouts.create(
    { amount: amountCents, currency },
    { stripeAccount: accountId }
  );
}
