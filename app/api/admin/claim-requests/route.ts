import { NextResponse } from "next/server";
import { getAdminClaimRequests } from "@/lib/queries/claim-requests";
import { requireAdminApi } from "@/lib/auth/admin-api";

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (auth.error) {
    return auth.error;
  }

  const status = new URL(request.url).searchParams.get("status") ?? "pending";

  try {
    const requests = await getAdminClaimRequests(status);
    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json({ error: "Could not load claim requests." }, { status: 503 });
  }
}
