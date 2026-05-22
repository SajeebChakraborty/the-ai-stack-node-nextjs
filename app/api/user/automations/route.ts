import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createAutomation, listAutomationsByOwner } from "@/lib/queries/automations";
import { userAutomationSchema } from "@/lib/validation/schemas";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const automations = await listAutomationsByOwner(user.id);
    return NextResponse.json({ automations });
  } catch {
    return NextResponse.json({ error: "Could not load your automations." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to publish an automation." }, { status: 401 });
  }

  const parsed = userAutomationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid automation payload." },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    const automation = await createAutomation({
      ownerId: user.id,
      title: data.title,
      shortDescription: data.shortDescription,
      description: data.description,
      thumbnailUrl: data.thumbnailUrl || undefined,
      promoVideoUrl: data.promoVideoUrl || undefined,
      zipFileUrl: data.zipFileUrl,
      setupInstructions: data.setupInstructions || undefined,
      toolingTags: data.toolingTags,
      highlights: data.highlights,
      setupMinutes: data.setupMinutes,
      priceCents: Math.round(data.priceUsd * 100)
    });

    return NextResponse.json({ automation }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create automation.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
