import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserListingClaimRequests } from "@/lib/queries/listing-claim-requests";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const requests = await getUserListingClaimRequests(user.id);
  return NextResponse.json({ requests });
}
