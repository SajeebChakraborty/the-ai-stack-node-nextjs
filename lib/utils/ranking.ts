import type { Tool } from "@/types/domain";

export function calculateRankingScore(tool: Pick<Tool, "rating" | "reviewCount" | "trustScore" | "trendingScore" | "growthRate" | "launchedAt">) {
  const ageInDays = Math.max(1, (Date.now() - new Date(tool.launchedAt).getTime()) / 86_400_000);
  const recencyBoost = Math.max(0, 22 - Math.log10(ageInDays) * 9);
  const reviewConfidence = Math.min(30, Math.log10(tool.reviewCount + 1) * 12);

  return Math.round(
    tool.rating * 10 +
      reviewConfidence +
      tool.trustScore * 0.22 +
      tool.trendingScore * 0.24 +
      tool.growthRate * 0.16 +
      recencyBoost
  );
}

export function sortTools(tools: Tool[], mode: "trending" | "top-rated" | "fastest-growing" | "newest") {
  return [...tools].sort((a, b) => {
    if (mode === "top-rated") return b.rating - a.rating || b.reviewCount - a.reviewCount;
    if (mode === "fastest-growing") return b.growthRate - a.growthRate;
    if (mode === "newest") return new Date(b.launchedAt).getTime() - new Date(a.launchedAt).getTime();
    return calculateRankingScore(b) - calculateRankingScore(a);
  });
}
