import { NextResponse } from "next/server";
import { canClaimAndManageListings } from "@/lib/auth/member-access";
import { getCurrentUser } from "@/lib/auth/session";
import { getFounderEntitlements } from "@/lib/founders/entitlements";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!canClaimAndManageListings(user.role)) {
    return NextResponse.json({ error: "Only member accounts can view plan entitlements." }, { status: 403 });
  }

  const entitlements = await getFounderEntitlements(user.id, user.role);
  return NextResponse.json({ entitlements });
}
