import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getCourseMarketplaceSettings } from "@/lib/marketplace/settings";
import { getConnectBalance, refreshConnectAccountStatus } from "@/lib/stripe/connect";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const [marketplace, connect, purchases, automationSales] = await Promise.all([
    getCourseMarketplaceSettings(),
    refreshConnectAccountStatus(user.id).catch(() => ({
      hasAccount: false,
      accountId: null,
      detailsSubmitted: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      ready: false,
      requirementsDue: [] as string[]
    })),
    prisma.coursePurchase.findMany({
      where: { course: { ownerId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { course: { select: { title: true } } }
    }),
    prisma.automationPurchase.findMany({
      where: { sellerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { automation: { select: { title: true } } }
    })
  ]);

  let balance: { availableCents: number; pendingCents: number; currency: string } | null = null;
  if (connect.accountId && connect.chargesEnabled) {
    try {
      const stripeBalance = await getConnectBalance(connect.accountId);
      const currency = marketplace.currency;
      const available = stripeBalance.available.find((entry) => entry.currency === currency) ?? stripeBalance.available[0];
      const pending = stripeBalance.pending.find((entry) => entry.currency === currency) ?? stripeBalance.pending[0];
      balance = {
        availableCents: available?.amount ?? 0,
        pendingCents: pending?.amount ?? 0,
        currency: (available?.currency ?? currency).toLowerCase()
      };
    } catch {
      balance = null;
    }
  }

  const lifetimeEarnings = await prisma.coursePurchase.aggregate({
    where: { course: { ownerId: user.id } },
    _sum: { creatorEarningCents: true }
  });

  const automationLifetime = await prisma.automationPurchase.aggregate({
    where: { sellerId: user.id, status: "released" },
    _sum: { sellerEarningCents: true }
  });

  const automationEscrow = await prisma.automationPurchase.aggregate({
    where: { sellerId: user.id, status: { in: ["paid_holding", "setup_confirmed", "complained"] } },
    _sum: { sellerEarningCents: true }
  });

  const totalLifetimeEarningsCents =
    (lifetimeEarnings._sum.creatorEarningCents ?? 0) + (automationLifetime._sum.sellerEarningCents ?? 0);

  return NextResponse.json({
    connect,
    balance,
    lifetimeEarningsCents: totalLifetimeEarningsCents,
    courseLifetimeEarningsCents: lifetimeEarnings._sum.creatorEarningCents ?? 0,
    automationLifetimeEarningsCents: automationLifetime._sum.sellerEarningCents ?? 0,
    automationEscrowCents: automationEscrow._sum.sellerEarningCents ?? 0,
    totalSales: purchases.length + automationSales.length,
    minWithdrawalCents: marketplace.minWithdrawalCents,
    currency: marketplace.currency,
    recentPurchases: purchases.map((purchase) => ({
      id: purchase.id,
      kind: "course" as const,
      title: purchase.course.title,
      amountCents: purchase.amountCents,
      platformFeeCents: purchase.platformFeeCents,
      creatorEarningCents: purchase.creatorEarningCents,
      currency: purchase.currency,
      createdAt: purchase.createdAt.toISOString()
    })),
    recentAutomationSales: automationSales.map((sale) => ({
      id: sale.id,
      kind: "automation" as const,
      title: sale.automation?.title ?? "Automation",
      amountCents: sale.amountCents,
      sellerEarningCents: sale.sellerEarningCents,
      currency: sale.currency,
      status: sale.status,
      createdAt: sale.createdAt.toISOString()
    }))
  });
}
