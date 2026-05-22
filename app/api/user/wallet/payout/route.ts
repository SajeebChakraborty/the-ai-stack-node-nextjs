import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getCourseMarketplaceSettings } from "@/lib/marketplace/settings";
import { createConnectPayout, refreshConnectAccountStatus, getConnectBalance } from "@/lib/stripe/connect";

const payoutSchema = z.object({
  amountCents: z.number().int().min(1)
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const parsed = payoutSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { stripeAccountId: true }
  });

  if (!profile?.stripeAccountId) {
    return NextResponse.json({ error: "Connect a Stripe account before requesting payouts." }, { status: 400 });
  }

  const marketplace = await getCourseMarketplaceSettings();
  if (parsed.data.amountCents < marketplace.minWithdrawalCents) {
    return NextResponse.json(
      { error: `Minimum withdrawal is ${(marketplace.minWithdrawalCents / 100).toFixed(2)} ${marketplace.currency.toUpperCase()}.` },
      { status: 400 }
    );
  }

  const status = await refreshConnectAccountStatus(user.id);
  if (!status.ready) {
    return NextResponse.json(
      { error: "Finish Stripe onboarding before requesting a payout." },
      { status: 400 }
    );
  }

  try {
    const balance = await getConnectBalance(profile.stripeAccountId);
    const currency = marketplace.currency;
    const available = balance.available.find((entry) => entry.currency === currency) ?? balance.available[0];
    if (!available || available.amount < parsed.data.amountCents) {
      return NextResponse.json(
        {
          error: `Insufficient available balance. You have ${((available?.amount ?? 0) / 100).toFixed(2)} ${(available?.currency ?? currency).toUpperCase()} ready to withdraw.`
        },
        { status: 400 }
      );
    }

    const payout = await createConnectPayout(profile.stripeAccountId, parsed.data.amountCents, available.currency);
    return NextResponse.json({ ok: true, payoutId: payout.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payout failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
