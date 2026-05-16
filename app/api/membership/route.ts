import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserMembershipSummary } from "@/lib/queries/membership";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const membership = await getUserMembershipSummary(user.id);
    return NextResponse.json(membership);
  } catch {
    return NextResponse.json({ error: "Could not load membership details." }, { status: 503 });
  }
}
