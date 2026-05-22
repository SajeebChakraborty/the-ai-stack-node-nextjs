import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const url = new URL(request.url);
  const role = url.searchParams.get("role") === "seller" ? "seller" : "buyer";

  const where = role === "seller" ? { sellerId: user.id } : { buyerId: user.id };

  try {
    const purchases = await prisma.automationPurchase.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      include: {
        automation: { select: { id: true, slug: true, title: true, thumbnailUrl: true, zipFileUrl: true } },
        ...(role === "seller"
          ? { buyer: { select: { id: true, fullName: true, email: true } } }
          : {})
      }
    });

    return NextResponse.json({
      purchases: purchases.map((purchase) => ({
        id: purchase.id,
        status: purchase.status,
        amountCents: purchase.amountCents,
        basePriceCents: purchase.basePriceCents,
        buyerFeeCents: purchase.buyerFeeCents,
        sellerFeeCents: purchase.sellerFeeCents,
        sellerEarningCents: purchase.sellerEarningCents,
        currency: purchase.currency,
        setupConfirmedAt: purchase.setupConfirmedAt?.toISOString() ?? null,
        autoReleaseAt: purchase.autoReleaseAt?.toISOString() ?? null,
        releasedAt: purchase.releasedAt?.toISOString() ?? null,
        complaintAt: purchase.complaintAt?.toISOString() ?? null,
        complaintReason: purchase.complaintReason,
        createdAt: purchase.createdAt.toISOString(),
        automation: purchase.automation
          ? {
              id: purchase.automation.id,
              slug: purchase.automation.slug,
              title: purchase.automation.title,
              thumbnailUrl: purchase.automation.thumbnailUrl,
              zipFileUrl:
                purchase.status === "paid_holding" ||
                purchase.status === "setup_confirmed" ||
                purchase.status === "released" ||
                purchase.status === "complained"
                  ? purchase.automation.zipFileUrl
                  : null
            }
          : null,
        buyer:
          role === "seller"
            ? (() => {
                const p = purchase as typeof purchase & {
                  buyer?: { id: string; fullName: string | null; email: string } | null;
                };
                if (!p.buyer) return null;
                return {
                  id: p.buyer.id,
                  name: p.buyer.fullName ?? p.buyer.email.split("@")[0],
                  email: p.buyer.email
                };
              })()
            : null
      }))
    });
  } catch {
    return NextResponse.json({ purchases: [] }, { status: 200 });
  }
}
