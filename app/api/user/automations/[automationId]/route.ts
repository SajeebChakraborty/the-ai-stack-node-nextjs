import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { deleteOwnedAutomation, updateOwnedAutomation } from "@/lib/queries/automations";
import { prisma } from "@/lib/db/prisma";
import { userAutomationSchema } from "@/lib/validation/schemas";

type Params = { params: Promise<{ automationId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { automationId } = await params;
  const row = await prisma.automation.findFirst({
    where: { id: automationId, ownerId: user.id },
    include: { _count: { select: { purchases: true } } }
  });
  if (!row) return NextResponse.json({ error: "Automation not found." }, { status: 404 });

  return NextResponse.json({ automation: row });
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { automationId } = await params;
  const parsed = userAutomationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid automation payload." },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const updated = await updateOwnedAutomation(user.id, automationId, {
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

  if (!updated) return NextResponse.json({ error: "Automation not found." }, { status: 404 });

  return NextResponse.json({ automation: updated });
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { automationId } = await params;
  const result = await deleteOwnedAutomation(user.id, automationId);

  if (!result.ok) return NextResponse.json({ error: "Automation not found." }, { status: 404 });

  return NextResponse.json({ ok: true, archived: result.archived });
}
