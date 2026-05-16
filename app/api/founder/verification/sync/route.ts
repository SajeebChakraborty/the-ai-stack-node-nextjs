import { NextResponse } from "next/server";
import { z } from "zod";
import { canClaimAndManageListings } from "@/lib/auth/member-access";
import { getCurrentUser } from "@/lib/auth/session";
import { getFounderEntitlements } from "@/lib/founders/entitlements";
import { isFounderPaymentVerified, syncFounderPaymentVerification } from "@/lib/founders/verification";
import { syncSubscriptionFromCheckoutSession } from "@/lib/stripe/checkout-subscription";

const bodySchema = z.object({
  sessionId: z.string().trim().min(3).optional()
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!canClaimAndManageListings(user.role)) {
    return NextResponse.json({ error: "Only member accounts can sync payment verification." }, { status: 403 });
  }

  const payload = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid sync payload." }, { status: 400 });
  }

  if (payload.data.sessionId) {
    try {
      await syncSubscriptionFromCheckoutSession(payload.data.sessionId, user.id);
    } catch (error) {
      if (error instanceof Error && error.message === "CHECKOUT_SESSION_USER_MISMATCH") {
        return NextResponse.json({ error: "Checkout session does not belong to this account." }, { status: 403 });
      }
    }
  } else {
    await syncFounderPaymentVerification(user.id);
  }

  const verified = await isFounderPaymentVerified(user.id, user.role);
  const entitlements = await getFounderEntitlements(user.id, user.role);

  return NextResponse.json({
    verified,
    entitlements,
    message: verified ? "Founder payment verified." : "Complete a founder plan payment to become verified."
  });
}
