import "server-only";

import { prisma } from "@/lib/db/prisma";
import { applyToolEngagementMetrics, syncToolEngagementMetrics } from "@/lib/analytics/tool-metrics";
import { mapDbTool, findSeedToolBySlug } from "@/lib/queries/tools";
import { sortTools } from "@/lib/utils/ranking";
import type { Tool } from "@/types/domain";

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
      createdAt: "desc" as const
    }
  }
};

export type DirectoryFilters = {
  categories: Array<{ slug: string; name: string }>;
  pricingModels: string[];
};

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
      orderBy: { name: "asc" }
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

export async function getDirectoryTools(params?: {
  query?: string;
  category?: string;
  pricing?: string;
  verified?: boolean;
  sort?: "trending" | "top-rated" | "fastest-growing" | "newest";
}) {
  await publishVerifiedFounderDrafts();

  const query = params?.query?.trim().toLowerCase();

  try {
    const dbTools = await prisma.tool.findMany({
      where: {
        status: "published",
        ...(params?.verified ? { verified: true } : {}),
        ...(params?.pricing && params.pricing !== "all"
          ? {
              pricingModel: params.pricing === "usage-based" ? "usage_based" : (params.pricing as "free" | "freemium" | "paid" | "enterprise")
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
          : {})
      },
      include: toolInclude,
      orderBy: { createdAt: "desc" }
    });

    const mapped = dbTools.map((tool) => mapDbTool(tool, findSeedToolBySlug(tool.slug) ?? undefined));
    const metricsMap = await syncToolEngagementMetrics(mapped.map((tool) => tool.id));
    let result: Tool[] = mapped.map((tool) => applyToolEngagementMetrics(tool, metricsMap));

    if (query) {
      result = result.filter((tool) =>
        [tool.name, tool.tagline, tool.description, ...tool.categories, ...tool.features].join(" ").toLowerCase().includes(query)
      );
    }

    return sortTools(result, params?.sort ?? "trending");
  } catch {
    return [];
  }
}
