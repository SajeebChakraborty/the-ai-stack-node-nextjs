import { categories, reviews, tools } from "@/data/catalog";
import { sortTools } from "@/lib/utils/ranking";

export async function getTools(params?: {
  query?: string;
  category?: string;
  pricing?: string;
  verified?: boolean;
  sort?: "trending" | "top-rated" | "fastest-growing" | "newest";
}) {
  const query = params?.query?.trim().toLowerCase();
  let result = tools;

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
  return tools.find((tool) => tool.slug === slug) ?? null;
}

export async function getToolReviews(slug: string) {
  return reviews.filter((review) => review.toolSlug === slug);
}

export async function getAlternatives(slug: string) {
  const current = await getToolBySlug(slug);
  if (!current) return [];
  return tools
    .filter((tool) => tool.slug !== slug && tool.categories.some((category) => current.categories.includes(category)))
    .slice(0, 3);
}

export async function getCategories() {
  return categories;
}
