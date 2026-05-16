import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { getAdminListingClaimRequests } from "@/lib/queries/listing-claim-requests";
import type { ListingClaimRequestStatus } from "@/types/domain";

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (auth.error) {
    return auth.error;
  }

  const status = new URL(request.url).searchParams.get("status") as ListingClaimRequestStatus | null;
  const requests = await getAdminListingClaimRequests(
    status === "pending" || status === "approved" || status === "rejected" ? status : undefined
  );

  return NextResponse.json({ requests });
}
