import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getCourseMarketplaceSettings } from "@/lib/marketplace/settings";

type Params = { params: Promise<{ purchaseId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { purchaseId } = await params;

  const purchase = await prisma.automationPurchase.findUnique({
    where: { id: purchaseId },
    select: { id: true, sellerId: true, status: true }
  });

  if (!purchase) return NextResponse.json({ error: "Purchase not found." }, { status: 404 });
  if (purchase.sellerId !== user.id) {
    return NextResponse.json({ error: "Only the seller can confirm setup." }, { status: 403 });
  }
  if (purchase.status !== "paid_holding") {
    return NextResponse.json(
      { error: `Cannot confirm setup from status "${purchase.status}".` },
      { status: 400 }
    );
  }

  const marketplace = await getCourseMarketplaceSettings();
  const releaseInMs = marketplace.automationAutoReleaseHours * 60 * 60 * 1000;
  const now = new Date();
  const autoReleaseAt = new Date(now.getTime() + releaseInMs);

  const updated = await prisma.automationPurchase.update({
    where: { id: purchase.id },
    data: {
      status: "setup_confirmed",
      setupConfirmedAt: now,
      autoReleaseAt
    },
    select: { id: true, status: true, setupConfirmedAt: true, autoReleaseAt: true }
  });

  return NextResponse.json({ purchase: updated });
}
