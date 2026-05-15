import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { getPublicStripeSettings, saveStripeSettings } from "@/lib/stripe/config";
import { stripeSettingsSchema } from "@/lib/validation/schemas";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) {
    return auth.error;
  }

  try {
    const settings = await getPublicStripeSettings();
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: "Could not load Stripe settings." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdminApi();
  if (auth.error) {
    return auth.error;
  }

  const payload = stripeSettingsSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  try {
    const settings = await saveStripeSettings(payload.data, auth.user!.id);
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: "Could not save Stripe settings." }, { status: 503 });
  }
}
