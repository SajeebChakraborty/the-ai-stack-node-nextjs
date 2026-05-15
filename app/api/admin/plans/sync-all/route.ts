import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { syncAllPremiumPlansToStripe } from "@/lib/stripe/sync-all-plans";

export async function POST() {
  const auth = await requireAdminApi();
  if (auth.error) {
    return auth.error;
  }

  try {
    const synced = await syncAllPremiumPlansToStripe();

    return NextResponse.json({ plans: synced, count: synced.length });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Stripe sync failed: ${error.message}`
            : "Stripe sync failed. Check billing keys in Admin → Settings."
      },
      { status: 502 }
    );
  }
}
