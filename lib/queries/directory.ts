import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { findSeedToolBySlug } from "@/lib/queries/tools";
import { sortTools } from "@/lib/utils/ranking";
import { DEFAULT_TOOL_LOGO, resolveToolLogoUrl } from "@/lib/utils/tool-logo";
import type { DirectoryFilters, DirectoryTool } from "@/types/directory";
import type { Tool } from "@/types/domain";

export type { DirectoryFilters };

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 48;

const directoryToolSelect = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  description: true,
  logoUrl: true,
  websiteUrl: true,
  affiliateUrl: true,
  pricingModel: true,
  startingPrice: true,
  ratingAvg: true,
  reviewCount: true,
  trustScore: true,
  trendingScore: true,
  growthRate: true,
  verified: true,
  founderId: true,
  launchedAt: true,
  metadata: true,
  categories: {
    select: {
      category: {
        select: {
          name: true
        }
      }
    }
  }
} satisfies Prisma.ToolSelect;

type DirectoryDbTool = Prisma.ToolGetPayload<{ select: typeof directoryToolSelect }>;

function toNumber(value: Prisma.Decimal | number | string | null | undefined) {
  if (value == null) {
    return 0;
  }

  return Number(value);
}

function getRecord(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, Prisma.JsonValue>;
}

function mapDirectoryTool(tool: DirectoryDbTool): DirectoryTool {
  const metadata = getRecord(tool.metadata);
  const seedTool = findSeedToolBySlug(tool.slug) ?? undefined;
  const promoVideoUrl =
    typeof metadata?.promoVideoUrl === "string" && metadata.promoVideoUrl.trim()
      ? metadata.promoVideoUrl
      : (seedTool?.promoVideoUrl ?? seedTool?.videos?.[0]?.embedUrl ?? null);

  return {
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    description: tool.description,
    logoUrl: resolveToolLogoUrl(tool.logoUrl ?? seedTool?.logoUrl ?? DEFAULT_TOOL_LOGO),
    websiteUrl: tool.websiteUrl,
    affiliateUrl: tool.affiliateUrl ?? seedTool?.affiliateUrl ?? tool.websiteUrl,
    categories: tool.categories.map((item) => item.category.name),
    features: [],
    pricingModel: tool.pricingModel === "usage_based" ? "usage-based" : tool.pricingModel,
    startingPrice: toNumber(tool.startingPrice),
    rating: toNumber(tool.ratingAvg),
    reviewCount: tool.reviewCount,
    trustScore: tool.trustScore,
    trendingScore: tool.trendingScore,
    growthRate: toNumber(tool.growthRate),
    verified: tool.verified,
    launchedAt: tool.launchedAt?.toISOString() ?? seedTool?.launchedAt ?? new Date().toISOString(),
    founder: seedTool?.founder ?? {
      name: "Unclaimed listing",
      title: "Founder",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=160&q=80",
      companyStage: "Independent",
      location: "Remote"
    },
    screenshots: [],
    promoVideoUrl,
    videos: promoVideoUrl
      ? [{ title: "Promo video", embedUrl: promoVideoUrl, duration: "Watch" }]
      : (seedTool?.videos ?? []),
    socials: seedTool?.socials ?? { x: "", linkedin: "", youtube: "", discord: "" },
    faqs: [],
    founderId: tool.founderId
  };
}

function buildDirectoryOrderBy(sort: "trending" | "top-rated" | "fastest-growing" | "newest"): Prisma.ToolOrderByWithRelationInput[] {
  switch (sort) {
    case "top-rated":
      return [{ ratingAvg: "desc" }, { reviewCount: "desc" }, { trendingScore: "desc" }];
    case "fastest-growing":
      return [{ growthRate: "desc" }, { trendingScore: "desc" }, { launchedAt: "desc" }];
    case "newest":
      return [{ launchedAt: "desc" }, { createdAt: "desc" }];
    case "trending":
    default:
      return [{ trendingScore: "desc" }, { growthRate: "desc" }, { ratingAvg: "desc" }];
  }
}

function buildDirectoryWhere(params?: {
  query?: string;
  category?: string;
  pricing?: string;
  verified?: boolean;
}): Prisma.ToolWhereInput {
  const query = params?.query?.trim();

  return {
    status: "published",
    ...(params?.verified ? { verified: true } : {}),
    ...(params?.pricing && params.pricing !== "all"
      ? {
          pricingModel:
            params.pricing === "usage-based"
              ? "usage_based"
              : (params.pricing as "free" | "freemium" | "paid" | "enterprise")
        }
      : {}),
    ...(params?.category && params.category !== "all"
      ? {
          categories: {
            some: {
              category: {
                OR: [{ slug: params.category }, { name: { equals: params.category } }]
              }
            }
          }
        }
      : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query } },
            { tagline: { contains: query } },
            { description: { contains: query } }
          ]
        }
      : {})
  };
}

export async function publishVerifiedFounderDrafts() {
  try {
    await prisma.tool.updateMany({
      where: {
        status: "draft",
        founderId: { not: null },
        founder: {
          founderProfile: {
            is: {
              verifiedAt: { not: null }
            }
          }
        }
      },
      data: {
        status: "published"
      }
    });
  } catch {
    // Ignore sync errors.
  }
}

export async function getDirectoryFilterOptions(): Promise<DirectoryFilters> {
  await publishVerifiedFounderDrafts();

  const [categories, pricingRows] = await Promise.all([
    prisma.category.findMany({
      where: {
        tools: {
          some: {
            tool: {
              status: "published"
            }
          }
        }
      },
      orderBy: { name: "asc" },
      select: { slug: true, name: true }
    }),
    prisma.tool.findMany({
      where: { status: "published" },
      select: { pricingModel: true },
      distinct: ["pricingModel"]
    })
  ]);

  return {
    categories: categories.map((category) => ({ slug: category.slug, name: category.name })),
    pricingModels: pricingRows.map((row) => (row.pricingModel === "usage_based" ? "usage-based" : row.pricingModel))
  };
}

export async function getPendingClaimToolIds(userId: string) {
  const rows = await prisma.listingClaimRequest.findMany({
    where: {
      requesterId: userId,
      status: "pending"
    },
    select: { toolId: true }
  });

  return rows.map((row) => row.toolId);
}

export async function getDirectoryToolsPage(params?: {
  query?: string;
  category?: string;
  pricing?: string;
  verified?: boolean;
  sort?: "trending" | "top-rated" | "fastest-growing" | "newest";
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params?.pageSize ?? DEFAULT_PAGE_SIZE));
  const skip = (page - 1) * pageSize;
  const sort = params?.sort ?? "trending";
  const where = buildDirectoryWhere(params);
  const orderBy = buildDirectoryOrderBy(sort);

  try {
    const [total, dbTools] = await Promise.all([
      prisma.tool.count({ where }),
      prisma.tool.findMany({
        where,
        select: directoryToolSelect,
        orderBy,
        skip,
        take: pageSize
      })
    ]);

    return {
      tools: dbTools.map(mapDirectoryTool),
      total,
      page,
      pageSize,
      hasMore: skip + dbTools.length < total
    };
  } catch {
    return {
      tools: [] as DirectoryTool[],
      total: 0,
      page,
      pageSize,
      hasMore: false
    };
  }
}

/** Full list for rankings and legacy callers — avoids heavy media includes. */
export async function getDirectoryTools(params?: {
  query?: string;
  category?: string;
  pricing?: string;
  verified?: boolean;
  sort?: "trending" | "top-rated" | "fastest-growing" | "newest";
}): Promise<Tool[]> {
  const where = buildDirectoryWhere(params);
  const sort = params?.sort ?? "trending";

  try {
    const dbTools = await prisma.tool.findMany({
      where,
      select: directoryToolSelect,
      orderBy: buildDirectoryOrderBy(sort)
    });

    const result: Tool[] = dbTools.map(mapDirectoryTool);
    return sortTools(result, sort);
  } catch {
    return [];
  }
}
