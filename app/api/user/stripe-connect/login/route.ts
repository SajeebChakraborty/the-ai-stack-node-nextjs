import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { createConnectLoginLink } from "@/lib/stripe/connect";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to open Stripe dashboard." }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { stripeAccountId: true }
  });

  if (!profile?.stripeAccountId) {
    return NextResponse.json(
      { error: "Connect a Stripe account before opening the dashboard." },
      { status: 400 }
    );
  }

  try {
    const url = await createConnectLoginLink(profile.stripeAccountId);
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create Stripe login link.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
