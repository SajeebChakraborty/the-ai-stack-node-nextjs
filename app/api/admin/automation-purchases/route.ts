import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdminApi } from "@/lib/auth/admin-api";

export async function GET(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status && status !== "all") {
    where.status = status;
  }

  const purchases = await prisma.automationPurchase.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    take: 100,
    include: {
      automation: { select: { id: true, slug: true, title: true } },
      buyer: { select: { id: true, fullName: true, email: true } }
    }
  });

  const sellerIds = Array.from(new Set(purchases.map((p) => p.sellerId)));
  const sellers = await prisma.profile.findMany({
    where: { id: { in: sellerIds } },
    select: { id: true, fullName: true, email: true, stripeAccountId: true }
  });
  const sellerMap = new Map(sellers.map((s) => [s.id, s]));

  return NextResponse.json({
    purchases: purchases.map((purchase) => ({
      id: purchase.id,
      status: purchase.status,
      amountCents: purchase.amountCents,
      basePriceCents: purchase.basePriceCents,
      buyerFeeCents: purchase.buyerFeeCents,
      sellerFeeCents: purchase.sellerFeeCents,
      sellerEarningCents: purchase.sellerEarningCents,
      platformTotalCents: purchase.platformTotalCents,
      currency: purchase.currency,
      setupConfirmedAt: purchase.setupConfirmedAt?.toISOString() ?? null,
      autoReleaseAt: purchase.autoReleaseAt?.toISOString() ?? null,
      releasedAt: purchase.releasedAt?.toISOString() ?? null,
      complaintAt: purchase.complaintAt?.toISOString() ?? null,
      complaintReason: purchase.complaintReason,
      resolutionNotes: purchase.resolutionNotes,
      createdAt: purchase.createdAt.toISOString(),
      automation: purchase.automation,
      buyer: purchase.buyer
        ? {
            id: purchase.buyer.id,
            name: purchase.buyer.fullName ?? purchase.buyer.email.split("@")[0],
            email: purchase.buyer.email
          }
        : null,
      seller: (() => {
        const s = sellerMap.get(purchase.sellerId);
        if (!s) return null;
        return {
          id: s.id,
          name: s.fullName ?? s.email.split("@")[0],
          email: s.email,
          stripeAccountId: s.stripeAccountId
        };
      })()
    }))
  });
}
