import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { parseListingClaimRequestAttachments } from "@/lib/validation/listing-claim-request-form";

const createSchema = z.object({
  toolId: z.string().trim().min(1),
  businessName: z.string().trim().min(2).max(160),
  businessStartDate: z.string().trim().min(1),
  businessRegistrationDate: z.string().trim().min(1),
  businessDocumentUrl: z.string().trim().url(),
  additionalNotes: z.string().trim().optional().default(""),
  attachmentUrls: z.string().trim().optional().default("")
});

function parseDate(value: string, label: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${label}.`);
  }
  return date;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to request a listing claim." }, { status: 401 });
  }

  if (user.role === "admin") {
    return NextResponse.json({ error: "Admins approve claims from the admin console." }, { status: 403 });
  }

  const payload = createSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json(
      { error: payload.error.issues[0]?.message ?? "Check the claim request form." },
      { status: 400 }
    );
  }

  const tool = await prisma.tool.findUnique({
    where: { id: payload.data.toolId },
    select: { id: true, founderId: true, name: true, status: true }
  });

  if (!tool) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  if (tool.founderId) {
    return NextResponse.json({ error: "This listing is already claimed." }, { status: 409 });
  }

  const existingPending = await prisma.listingClaimRequest.findFirst({
    where: {
      toolId: tool.id,
      requesterId: user.id,
      status: "pending"
    },
    select: { id: true }
  });

  if (existingPending) {
    return NextResponse.json({ error: "You already have a pending claim request for this listing." }, { status: 409 });
  }

  try {
    const businessStartDate = parseDate(payload.data.businessStartDate, "business start date");
    const businessRegistrationDate = parseDate(payload.data.businessRegistrationDate, "business registration date");
    const attachments = parseListingClaimRequestAttachments(payload.data.attachmentUrls);

    const claimRequest = await prisma.listingClaimRequest.create({
      data: {
        toolId: tool.id,
        requesterId: user.id,
        businessName: payload.data.businessName,
        businessStartDate,
        businessRegistrationDate,
        businessDocumentUrl: payload.data.businessDocumentUrl,
        additionalNotes: payload.data.additionalNotes || null,
        attachmentUrls: attachments.length ? attachments : undefined
      },
      select: { id: true }
    });

    return NextResponse.json({
      message: `Your claim request for ${tool.name} was submitted and is pending admin review.`,
      requestId: claimRequest.id
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not submit claim request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
