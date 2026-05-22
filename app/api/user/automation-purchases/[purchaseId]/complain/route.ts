import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

const complainSchema = z.object({
  reason: z.string().trim().min(10).max(2000)
});

type Params = { params: Promise<{ purchaseId: string }> };

export async function POST(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { purchaseId } = await params;
  const parsed = complainSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please describe the issue (at least 10 characters)." },
      { status: 400 }
    );
  }

  const purchase = await prisma.automationPurchase.findUnique({
    where: { id: purchaseId },
    select: { id: true, buyerId: true, status: true }
  });

  if (!purchase) return NextResponse.json({ error: "Purchase not found." }, { status: 404 });
  if (purchase.buyerId !== user.id) {
    return NextResponse.json({ error: "Only the buyer can file a complaint." }, { status: 403 });
  }
  if (purchase.status !== "paid_holding" && purchase.status !== "setup_confirmed") {
    return NextResponse.json(
      { error: `Cannot file a complaint from status "${purchase.status}".` },
      { status: 400 }
    );
  }

  const updated = await prisma.automationPurchase.update({
    where: { id: purchase.id },
    data: {
      status: "complained",
      complaintReason: parsed.data.reason,
      complaintAt: new Date()
    },
    select: { id: true, status: true, complaintAt: true }
  });

  return NextResponse.json({ purchase: updated });
}
