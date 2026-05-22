import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { refundAutomationPurchase } from "@/lib/automation/escrow";

type Params = { params: Promise<{ purchaseId: string }> };

const schema = z.object({ notes: z.string().max(2000).optional() });

export async function POST(request: Request, { params }: Params) {
  const { user, error } = await requireAdminApi();
  if (error || !user) return error ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { purchaseId } = await params;
  const body = (await request.json().catch(() => ({}))) as unknown;
  const parsed = schema.safeParse(body ?? {});
  const notes = parsed.success ? parsed.data.notes : undefined;

  const result = await refundAutomationPurchase(purchaseId, user.id, notes);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }
  return NextResponse.json({ ok: true, refundId: result.refundId });
}
