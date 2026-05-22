import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-api";
import {
  getCourseMarketplaceSettings,
  saveCourseMarketplaceSettings
} from "@/lib/marketplace/settings";
import { courseMarketplaceSettingsSchema } from "@/lib/validation/schemas";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const settings = await getCourseMarketplaceSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const payload = courseMarketplaceSettingsSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  try {
    const settings = await saveCourseMarketplaceSettings(payload.data, auth.user.id);
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: "Could not save marketplace settings." }, { status: 503 });
  }
}
