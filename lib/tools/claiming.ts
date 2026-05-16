import "server-only";

import { isFounderPaymentVerified } from "@/lib/founders/verification";
import { prisma } from "@/lib/db/prisma";
import { normalizeYoutubeEmbedUrl } from "@/lib/tools/media";
import { filterDisplayFeatures } from "@/lib/utils/display-features";
import { filterLikelyImageUrls, isLikelyImageUrl, resolveToolLogoUrl } from "@/lib/utils/tool-logo";
import type { PricingModel } from "@/types/domain";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function toPricingModel(value: PricingModel) {
  return value === "usage-based" ? "usage_based" : value;
}

async function ensureCategory(categoryName: string) {
  const slug = slugify(categoryName);

  return prisma.category.upsert({
    where: {
      slug
    },
    update: {
      name: categoryName
    },
    create: {
      slug,
      name: categoryName,
      description: `${categoryName} tools listed on TheAiStack.`,
      seoTitle: `${categoryName} tools`,
      seoDescription: `Discover claimed and reviewed ${categoryName} tools on TheAiStack.`
    }
  });
}

async function createMediaAssets({
  founderId,
  promoVideoUrl,
  screenshotUrls,
  toolId,
  videoUrls
}: {
  founderId: string | null;
  promoVideoUrl?: string;
  screenshotUrls: string[];
  toolId: string;
  videoUrls: string[];
}) {
  for (const [index, screenshot] of screenshotUrls.entries()) {
    await prisma.mediaAsset.create({
      data: {
        ownerId: founderId ?? undefined,
        toolId,
        kind: "image",
        bucket: "claimed-listings",
        path: `${toolId}/screenshots/${index + 1}`,
        publicUrl: screenshot,
        altText: `Listing screenshot ${index + 1}`
      }
    });
  }

  const normalizedPromo = promoVideoUrl ? normalizeYoutubeEmbedUrl(promoVideoUrl) : null;

  if (normalizedPromo) {
    await prisma.mediaAsset.create({
      data: {
        ownerId: founderId ?? undefined,
        toolId,
        kind: "video",
        bucket: "claimed-listings",
        path: `${toolId}/videos/promo`,
        publicUrl: normalizedPromo,
        altText: "Promo video",
        metadata: {
          title: "Promo video",
          duration: "Watch"
        }
      }
    });
  }

  let videoIndex = 0;
  for (const videoUrl of videoUrls) {
    const normalized = normalizeYoutubeEmbedUrl(videoUrl);
    if (normalizedPromo && normalized === normalizedPromo) {
      continue;
    }

    videoIndex += 1;
    await prisma.mediaAsset.create({
      data: {
        ownerId: founderId ?? undefined,
        toolId,
        kind: "video",
        bucket: "claimed-listings",
        path: `${toolId}/videos/${videoIndex}`,
        publicUrl: normalized,
        altText: `Founder video ${videoIndex}`,
        metadata: {
          title: `Founder video ${videoIndex}`,
          duration: "Watch"
        }
      }
    });
  }
}

export async function createFounderClaimedListing({
  affiliateUrl,
  categories,
  description,
  features,
  founderId,
  logoUrl,
  name,
  pricingModel,
  screenshotUrls,
  slug,
  socialLinks,
  startingPrice,
  tagline,
  promoVideoUrl,
  videoUrls,
  websiteUrl,
  autoApprove = false
}: {
  affiliateUrl?: string;
  categories: string[];
  description: string;
  features: string[];
  founderId: string | null;
  logoUrl?: string;
  name: string;
  pricingModel: PricingModel;
  screenshotUrls: string[];
  slug: string;
  socialLinks: Partial<Record<"discord" | "linkedin" | "x" | "youtube", string>>;
  startingPrice: number;
  tagline: string;
  promoVideoUrl?: string;
  videoUrls: string[];
  websiteUrl: string;
  autoApprove?: boolean;
}) {
  const existingTool = await prisma.tool.findUnique({
    where: {
      slug
    },
    select: {
      id: true,
      founderId: true
    }
  });

  if (existingTool) {
    throw new Error("LISTING_ALREADY_CLAIMED");
  }

  const categoryRecords = await Promise.all(categories.map((categoryName) => ensureCategory(categoryName)));
  const owner = founderId
    ? await prisma.profile.findUnique({
        where: { id: founderId },
        select: { role: true }
      })
    : null;
  const founderVerified = founderId ? await isFounderPaymentVerified(founderId, owner?.role ?? "user") : false;
  const normalizedPromoVideo = promoVideoUrl ? normalizeYoutubeEmbedUrl(promoVideoUrl) : null;
  const published = autoApprove || founderVerified;
  const tool = await prisma.tool.create({
    data: {
      slug,
      founderId: founderId ?? undefined,
      name,
      tagline,
      description,
      logoUrl: logoUrl?.trim() && isLikelyImageUrl(logoUrl) ? resolveToolLogoUrl(logoUrl) : null,
      websiteUrl,
      affiliateUrl: affiliateUrl || websiteUrl,
      pricingModel: toPricingModel(pricingModel),
      startingPrice,
      verified: autoApprove || founderVerified,
      status: published ? "published" : "draft",
      launchedAt: new Date(),
      socialLinks,
      metadata: {
        features: filterDisplayFeatures(features),
        faqs: [],
        ...(normalizedPromoVideo ? { promoVideoUrl: normalizedPromoVideo } : {})
      }
    }
  });

  await prisma.toolCategory.createMany({
    data: categoryRecords.map((category) => ({
      toolId: tool.id,
      categoryId: category.id
    })),
    skipDuplicates: true
  });

  await createMediaAssets({
    founderId,
    promoVideoUrl: normalizedPromoVideo ?? undefined,
    screenshotUrls: filterLikelyImageUrls(screenshotUrls),
    toolId: tool.id,
    videoUrls
  });

  return tool;
}
