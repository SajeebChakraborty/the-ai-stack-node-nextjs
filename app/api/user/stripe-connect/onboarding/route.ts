import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createConnectOnboardingLink } from "@/lib/stripe/connect";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to connect Stripe." }, { status: 401 });
  }

  try {
    const origin = new URL(request.url).origin;
    const url = await createConnectOnboardingLink(user.id, user.email, origin);
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start Stripe onboarding.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
