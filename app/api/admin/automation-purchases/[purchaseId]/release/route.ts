import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { releaseAutomationFunds } from "@/lib/automation/escrow";

type Params = { params: Promise<{ purchaseId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { user, error } = await requireAdminApi();
  if (error || !user) return error ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { purchaseId } = await params;
  const result = await releaseAutomationFunds(purchaseId, user.id);

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }
  return NextResponse.json({ ok: true, alreadyReleased: result.alreadyReleased, transferId: result.transferId });
}
