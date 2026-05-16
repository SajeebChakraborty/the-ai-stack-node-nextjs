import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { rejectListingClaimRequest } from "@/lib/queries/listing-claim-requests";

type Context = {
  params: Promise<{ requestId: string }>;
};

const bodySchema = z.object({
  adminNotes: z.string().trim().optional()
});

export async function POST(request: Request, context: Context) {
  const auth = await requireAdminApi();
  if (auth.error) {
    return auth.error;
  }

  const { requestId } = await context.params;
  const payload = bodySchema.safeParse(await request.json().catch(() => ({})));

  try {
    await rejectListingClaimRequest(
      requestId,
      auth.user.id,
      payload.success ? payload.data.adminNotes : undefined
    );

    return NextResponse.json({ message: "Claim request rejected." });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "REQUEST_NOT_FOUND":
          return NextResponse.json({ error: "Claim request not found." }, { status: 404 });
        case "REQUEST_ALREADY_REVIEWED":
          return NextResponse.json({ error: "This request was already reviewed." }, { status: 409 });
      }
    }

    return NextResponse.json({ error: "Could not reject the claim request." }, { status: 500 });
  }
}
