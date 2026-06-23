import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { categories, reviews as seedReviews, tools as seedTools } from "@/data/catalog";
import type { Review, Tool } from "@/types/domain";
import { applyToolEngagementMetrics, syncToolEngagementMetrics } from "@/lib/analytics/tool-metrics";
import { filterDisplayFeatures } from "@/lib/utils/display-features";
import {
  resolveDirectoryPromoVideoUrl,
  resolveToolScreenshots
} from "@/lib/utils/tool-media-defaults";
import { filterLikelyImageUrls, resolveToolLogoUrl } from "@/lib/utils/tool-logo";
import { sortTools } from "@/lib/utils/ranking";

const toolInclude = {
  categories: {
    include: {
      category: true
    }
  },
  founder: {
    include: {
      founderProfile: true
    }
  },
  mediaAssets: {
    orderBy: {
      createdAt: "desc"
    }
  }
} satisfies Prisma.ToolInclude;

const toolPageInclude = {
  ...toolInclude,
  reviews: {
    where: {
      isPublished: true
    },
    include: {
      author: true
    },
    orderBy: {
      createdAt: "desc"
    }
  },
  discussions: {
    include: {
      author: true,
      votes: true
    },
    orderBy: [{ isPinned: "desc" }, { voteScore: "desc" }, { createdAt: "desc" }]
  },
  updates: {
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }]
  }
} satisfies Prisma.ToolInclude;

export type ToolDiscussion = {
  authorName: string;
  authorRole: string;
  body: string;
  commentCount: number;
  createdAt: string;
  id: string;
  title: string;
  voteScore: number;
};

export type ToolUpdateItem = {
  authorName: string;
  body: string;
  createdAt: string;
  id: string;
  publishedAt: string | null;
  title: string;
};

export type FounderManagedTool = {
  categories: string[];
  id: string;
  mediaCount: number;
  name: string;
  slug: string;
  status: "draft" | "published" | "archived";
  updateCount: number;
};

export type ToolPageData = {
  alternatives: Tool[];
  discussions: ToolDiscussion[];
  tool: Tool & { founderId?: string | null };
  toolReviews: Review[];
  updates: ToolUpdateItem[];
};

type DbTool = Prisma.ToolGetPayload<{
  include: typeof toolInclude;
}>;

type DbToolPage = Prisma.ToolGetPayload<{
  include: typeof toolPageInclude;
}>;

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

function getStringArray(value: Prisma.JsonValue | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function getFaqs(value: Prisma.JsonValue | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const question = "question" in item && typeof item.question === "string" ? item.question : null;
      const answer = "answer" in item && typeof item.answer === "string" ? item.answer : null;

      if (!question || !answer) {
        return null;
      }

      return { question, answer };
    })
    .filter((item): item is { question: string; answer: string } => Boolean(item));
}

function getMediaByKind(tool: DbTool | DbToolPage, kind: "image" | "video") {
  return tool.mediaAssets.filter((asset) => asset.kind === kind);
}

export function mapDbTool(tool: DbTool | DbToolPage, seedTool?: Tool): Tool & { founderId?: string | null } {
  const metadata = getRecord(tool.metadata);
  const socialLinks = getRecord(tool.socialLinks);
  const screenshots = getMediaByKind(tool, "image").map((asset) => asset.publicUrl);
  const promoFromMetadata =
    typeof metadata?.promoVideoUrl === "string" && metadata.promoVideoUrl.trim() ? metadata.promoVideoUrl : null;
  const promoFromMedia = tool.mediaAssets.find(
    (asset) =>
      asset.kind === "video" &&
      (asset.path.includes("/videos/promo") || asset.altText?.toLowerCase() === "promo video")
  );
  const videos = getMediaByKind(tool, "video").map((asset) => {
    const videoMetadata = getRecord(asset.metadata);
    const title = typeof videoMetadata?.title === "string" ? videoMetadata.title : `${tool.name} video`;
    const duration = typeof videoMetadata?.duration === "string" ? videoMetadata.duration : "Watch";

    return {
      title,
      embedUrl: asset.publicUrl,
      duration
    };
  });

  const seed = tool.slug || tool.id;
  const resolvedPromo = resolveDirectoryPromoVideoUrl({
    id: tool.id,
    slug: tool.slug,
    promoVideoUrl:
      promoFromMetadata ??
      promoFromMedia?.publicUrl ??
      seedTool?.promoVideoUrl ??
      videos[0]?.embedUrl ??
      seedTool?.videos?.[0]?.embedUrl ??
      null,
    seedPromoVideoUrl: seedTool?.promoVideoUrl ?? seedTool?.videos?.[0]?.embedUrl ?? null,
    seedVideos: videos.length ? videos : seedTool?.videos
  });

  return {
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    description: tool.description,
    logoUrl: resolveToolLogoUrl(tool.logoUrl ?? seedTool?.logoUrl ?? null, seed),
    websiteUrl: tool.websiteUrl,
    affiliateUrl: tool.affiliateUrl ?? seedTool?.affiliateUrl ?? tool.websiteUrl,
    categories: tool.categories.map((item) => item.category.name),
    features: filterDisplayFeatures(
      getStringArray(metadata?.features).length ? getStringArray(metadata?.features) : seedTool?.features ?? []
    ),
    pricingModel: tool.pricingModel === "usage_based" ? "usage-based" : tool.pricingModel,
    startingPrice: toNumber(tool.startingPrice),
    rating: toNumber(tool.ratingAvg),
    reviewCount: tool.reviewCount,
    trustScore: tool.trustScore,
    trendingScore: tool.trendingScore,
    growthRate: toNumber(tool.growthRate),
    verified: tool.verified,
    launchedAt: tool.launchedAt?.toISOString() ?? seedTool?.launchedAt ?? new Date().toISOString(),
    founder: {
      name: tool.founder?.fullName ?? seedTool?.founder.name ?? "Unclaimed listing",
      title: tool.founder?.founderProfile?.title ?? seedTool?.founder.title ?? "Founder",
      avatarUrl: tool.founder?.avatarUrl ?? seedTool?.founder.avatarUrl ?? "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=160&q=80",
      companyStage: tool.founder?.founderProfile?.companyStage ?? seedTool?.founder.companyStage ?? "Independent",
      location: tool.founder?.location ?? seedTool?.founder.location ?? "Remote"
    },
    screenshots: filterLikelyImageUrls(
      screenshots.length
        ? screenshots
        : resolveToolScreenshots({
            id: tool.id,
            slug: tool.slug,
            metadata: metadata as Record<string, unknown> | null,
            seedScreenshots: seedTool?.screenshots
          })
    ),
    promoVideoUrl: resolvedPromo,
    videos: [{ title: "Promo video", embedUrl: resolvedPromo, duration: "Watch" }, ...videos.filter((v) => v.embedUrl !== resolvedPromo)],
    socials: {
      x: typeof socialLinks?.x === "string" ? socialLinks.x : seedTool?.socials.x ?? "",
      linkedin: typeof socialLinks?.linkedin === "string" ? socialLinks.linkedin : seedTool?.socials.linkedin ?? "",
      youtube: typeof socialLinks?.youtube === "string" ? socialLinks.youtube : seedTool?.socials.youtube ?? "",
      discord: typeof socialLinks?.discord === "string" ? socialLinks.discord : seedTool?.socials.discord ?? ""
    },
    faqs: getFaqs(metadata?.faqs).length ? getFaqs(metadata?.faqs) : seedTool?.faqs ?? [],
    founderId: tool.founderId
  };
}

function mapDbReview(
  review: {
    author: {
      avatarUrl: string | null;
      email: string;
      fullName: string | null;
      handle: string | null;
      role: string;
    } | null;
    body: string;
    createdAt: Date;
    helpfulCount: number;
    id: string;
    isVerifiedReviewer: boolean;
    rating: number;
    reviewType: string;
    title: string;
    trustScore: number;
  },
  toolSlug: string
): Review {
  const authorRole = review.author?.role === "founder" ? "founder" : review.reviewType === "verified_social" ? "verified-social" : review.reviewType;

  return {
    id: review.id,
    toolSlug,
    author: review.author?.fullName ?? review.author?.email ?? "Community member",
    authorHandle: review.author?.handle ?? review.author?.email?.split("@")[0] ?? "member",
    authorAvatar: review.author?.avatarUrl ?? "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80",
    type: authorRole as Review["type"],
    rating: review.rating,
    title: review.title,
    body: review.body,
    helpful: review.helpfulCount,
    trustScore: review.trustScore,
    verifiedReviewer: review.isVerifiedReviewer,
    createdAt: review.createdAt.toISOString()
  };
}

function mapDbDiscussion(discussion: DbToolPage["discussions"][number]): ToolDiscussion {
  return {
    id: discussion.id,
    title: discussion.title,
    body: discussion.body,
    voteScore: discussion.voteScore,
    commentCount: discussion.commentCount,
    authorName: discussion.author?.fullName ?? discussion.author?.email ?? "Community member",
    authorRole: discussion.author?.role ?? "user",
    createdAt: discussion.createdAt.toISOString()
  };
}

function mapDbUpdate(update: DbToolPage["updates"][number], founderName: string): ToolUpdateItem {
  return {
    id: update.id,
    title: update.title,
    body: update.body,
    publishedAt: update.publishedAt?.toISOString() ?? null,
    createdAt: update.createdAt.toISOString(),
    authorName: founderName
  };
}

async function getDbTools() {
  return prisma.tool.findMany({
    where: {
      status: {
        not: "archived"
      }
    },
    include: toolInclude
  });
}

export function findSeedToolBySlug(slug: string) {
  return seedTools.find((tool) => tool.slug === slug) ?? null;
}

export async function getTools(params?: {
  query?: string;
  category?: string;
  pricing?: string;
  verified?: boolean;
  sort?: "trending" | "top-rated" | "fastest-growing" | "newest";
}) {
  const query = params?.query?.trim().toLowerCase();
  let result: Tool[] = [];

  try {
    const dbTools = await prisma.tool.findMany({
      where: {
        status: "published"
      },
      include: toolInclude
    });

    result = dbTools.map((tool) => mapDbTool(tool, findSeedToolBySlug(tool.slug) ?? undefined));
  } catch {
    result = [];
  }

  if (query) {
    result = result.filter((tool) =>
      [tool.name, tool.tagline, tool.description, ...tool.categories, ...tool.features].join(" ").toLowerCase().includes(query)
    );
  }

  if (params?.category && params.category !== "all") {
    result = result.filter((tool) => tool.categories.some((category) => category.toLowerCase() === params.category?.toLowerCase()));
  }

  if (params?.pricing && params.pricing !== "all") {
    result = result.filter((tool) => tool.pricingModel === params.pricing);
  }

  if (params?.verified) {
    result = result.filter((tool) => tool.verified);
  }

  return sortTools(result, params?.sort ?? "trending");
}

export async function getToolBySlug(slug: string) {
  try {
    const dbTool = await prisma.tool.findUnique({
      where: { slug },
      include: toolInclude
    });

    if (dbTool) {
      return mapDbTool(dbTool, findSeedToolBySlug(slug) ?? undefined);
    }
  } catch {
    // fall through to seeded catalog
  }

  return findSeedToolBySlug(slug);
}

export async function getToolReviews(slug: string) {
  try {
    const dbTool = await prisma.tool.findUnique({
      where: { slug },
      include: {
        reviews: {
          where: {
            isPublished: true
          },
          include: {
            author: true
          },
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    });

    if (dbTool) {
      return dbTool.reviews.map((review) => mapDbReview(review, slug));
    }
  } catch {
    // fall through to seeded catalog
  }

  return seedReviews.filter((review) => review.toolSlug === slug);
}

export async function getAlternatives(slug: string) {
  try {
    const currentTool = await prisma.tool.findUnique({
      where: { slug },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });

    if (currentTool) {
      const categoryIds = currentTool.categories.map((item) => item.categoryId);
      const alternatives = await prisma.tool.findMany({
        where: {
          slug: {
            not: slug
          },
          status: "published",
          categories: {
            some: {
              categoryId: {
                in: categoryIds
              }
            }
          }
        },
        include: toolInclude,
        take: 3,
        orderBy: {
          trendingScore: "desc"
        }
      });

      return alternatives.map((tool) => mapDbTool(tool, findSeedToolBySlug(tool.slug) ?? undefined));
    }
  } catch {
    // fall through to seeded catalog
  }

  const current = findSeedToolBySlug(slug);
  if (!current) {
    return [];
  }

  return seedTools.filter((tool) => tool.slug !== slug && tool.categories.some((category) => current.categories.includes(category))).slice(0, 3);
}

export async function getToolPageData(slug: string): Promise<ToolPageData | null> {
  try {
    const dbTool = await prisma.tool.findUnique({
      where: { slug },
      include: toolPageInclude
    });

    if (dbTool) {
      const mappedTool = mapDbTool(dbTool, findSeedToolBySlug(slug) ?? undefined);
      const alternatives = await getAlternatives(slug);
      const metricsMap = await syncToolEngagementMetrics([mappedTool.id, ...alternatives.map((item) => item.id)]);
      const tool = applyToolEngagementMetrics(mappedTool, metricsMap);

      return {
        tool,
        toolReviews: dbTool.reviews.map((review) => mapDbReview(review, dbTool.slug)),
        discussions: dbTool.discussions.map(mapDbDiscussion),
        updates: dbTool.updates.map((update) => mapDbUpdate(update, tool.founder.name)),
        alternatives: alternatives.map((item) => applyToolEngagementMetrics(item, metricsMap))
      };
    }
  } catch {
    // fall back to seeded catalog
  }

  const seedTool = findSeedToolBySlug(slug);
  if (!seedTool) {
    return null;
  }

  return {
    tool: seedTool,
    toolReviews: seedReviews.filter((review) => review.toolSlug === slug),
    discussions: [],
    updates: [],
    alternatives: seedTools.filter((tool) => tool.slug !== slug && tool.categories.some((category) => seedTool.categories.includes(category))).slice(0, 3)
  };
}

export async function getFounderManagedTools(founderId: string): Promise<FounderManagedTool[]> {
  try {
    const tools = await prisma.tool.findMany({
      where: {
        founderId
      },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        mediaAssets: {
          select: {
            id: true
          }
        },
        updates: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    return tools.map((tool) => ({
      id: tool.id,
      slug: tool.slug,
      name: tool.name,
      categories: tool.categories.map((item) => item.category.name),
      mediaCount: tool.mediaAssets.length,
      status: tool.status,
      updateCount: tool.updates.length
    }));
  } catch {
    return [];
  }
}

export async function getCategories() {
  return categories;
}
