import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getFounderEntitlements } from "@/lib/founders/entitlements";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (user.role !== "founder") {
    return NextResponse.json({ error: "Only founders can view plan entitlements." }, { status: 403 });
  }

  const entitlements = await getFounderEntitlements(user.id, user.role);
  return NextResponse.json({ entitlements });
}
