import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { assertFounderCanClaim } from "@/lib/founders/entitlements";
import { createFounderClaimedListing } from "@/lib/tools/claiming";
import { parseListInput } from "@/lib/tools/media";

const claimSchema = z.object({
  affiliateUrl: z.string().trim().url().optional().or(z.literal("")),
  categories: z.string().trim().min(1),
  description: z.string().trim().min(20),
  features: z.string().trim().optional().default(""),
  logoUrl: z.string().trim().url().optional().or(z.literal("")),
  name: z.string().trim().min(2).max(120),
  pricingModel: z.enum(["free", "freemium", "paid", "usage-based", "enterprise"]),
  screenshotUrls: z.string().trim().optional().default(""),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug must use lowercase letters, numbers, and hyphens."),
  socialDiscord: z.string().trim().url().optional().or(z.literal("")),
  socialLinkedIn: z.string().trim().url().optional().or(z.literal("")),
  socialX: z.string().trim().url().optional().or(z.literal("")),
  socialYouTube: z.string().trim().url().optional().or(z.literal("")),
  startingPrice: z.coerce.number().min(0),
  tagline: z.string().trim().min(4).max(160),
  videoUrls: z.string().trim().optional().default(""),
  websiteUrl: z.string().trim().url()
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (user.role !== "founder") {
    return NextResponse.json({ error: "Only founders can claim listings." }, { status: 403 });
  }

  const claimAccess = await assertFounderCanClaim(user.id, user.role);
  if (!claimAccess.ok) {
    return NextResponse.json(
      {
        error: claimAccess.error,
        code: claimAccess.code,
        entitlements: "entitlements" in claimAccess ? claimAccess.entitlements : undefined
      },
      { status: claimAccess.status }
    );
  }

  const payload = claimSchema.safeParse(await request.json());
  if (!payload.success) {
    const messages = payload.error.issues.map((issue) => issue.message);
    return NextResponse.json(
      {
        error: messages[0] ?? "Enter the listing details with valid links and pricing.",
        code: "VALIDATION_ERROR",
        messages
      },
      { status: 400 }
    );
  }

  try {
    const tool = await createFounderClaimedListing({
      affiliateUrl: payload.data.affiliateUrl || undefined,
      categories: parseListInput(payload.data.categories),
      description: payload.data.description,
      features: parseListInput(payload.data.features),
      founderId: user.id,
      logoUrl: payload.data.logoUrl || undefined,
      name: payload.data.name,
      pricingModel: payload.data.pricingModel,
      screenshotUrls: parseListInput(payload.data.screenshotUrls),
      slug: payload.data.slug,
      socialLinks: {
        x: payload.data.socialX || undefined,
        linkedin: payload.data.socialLinkedIn || undefined,
        youtube: payload.data.socialYouTube || undefined,
        discord: payload.data.socialDiscord || undefined
      },
      startingPrice: payload.data.startingPrice,
      tagline: payload.data.tagline,
      videoUrls: parseListInput(payload.data.videoUrls),
      websiteUrl: payload.data.websiteUrl
    });

    return NextResponse.json({
      message: `${tool.name} was created as a claimed founder listing.`,
      slug: tool.slug
    });
  } catch (error) {
    if (error instanceof Error && error.message === "LISTING_ALREADY_CLAIMED") {
      return NextResponse.json({ error: "That slug is already in use by another listing." }, { status: 409 });
    }

    return NextResponse.json({ error: "Creating the claimed listing failed. Please try again." }, { status: 500 });
  }
}
