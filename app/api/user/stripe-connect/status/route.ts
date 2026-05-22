import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { refreshConnectAccountStatus } from "@/lib/stripe/connect";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to view Stripe status." }, { status: 401 });
  }

  try {
    const status = await refreshConnectAccountStatus(user.id);
    return NextResponse.json({ status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load Stripe status.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
