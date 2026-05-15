import type { Review, Tool } from "@/types/domain";

export type ToolReviewSummary = {
  fakeReviewLabel: string;
  fakeReviewTone: "low" | "medium" | "elevated";
  highlights: string[];
  summary: string;
};

function getFakeReviewRisk(reviews: Review[], tool: Tool): Pick<ToolReviewSummary, "fakeReviewLabel" | "fakeReviewTone"> {
  if (reviews.length === 0) {
    return {
      fakeReviewLabel: tool.verified ? "Awaiting proof" : "Not enough data",
      fakeReviewTone: "elevated"
    };
  }

  const verifiedShare = reviews.filter((review) => review.verifiedReviewer).length / reviews.length;

  if (reviews.length >= 3 && verifiedShare >= 0.5 && tool.verified) {
    return { fakeReviewLabel: "Low", fakeReviewTone: "low" };
  }

  if (reviews.length >= 2) {
    return { fakeReviewLabel: "Medium", fakeReviewTone: "medium" };
  }

  return { fakeReviewLabel: "Early signal only", fakeReviewTone: "medium" };
}

export function buildToolReviewSummary(tool: Tool, reviews: Review[]): ToolReviewSummary {
  const risk = getFakeReviewRisk(reviews, tool);

  if (!reviews.length) {
    return {
      ...risk,
      summary: `${tool.name} does not have published community reviews yet. Buyer proof will appear here after users or other founders share implementation context.`,
      highlights: tool.categories.length
        ? [`Best fit signals will come from ${tool.categories.slice(0, 2).join(" and ")} buyers.`]
        : []
    };
  }

  const averageRating = reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
  const topTitles = reviews.slice(0, 3).map((review) => review.title);
  const categoryFit = tool.categories.slice(0, 2).join(" and ");

  return {
    ...risk,
    summary: `${reviews.length} verified community review${reviews.length === 1 ? "" : "s"} rate ${tool.name} ${averageRating.toFixed(1)}/5. Recent reviewers highlight ${topTitles.join(", ")}.`,
    highlights: [
      categoryFit ? `Common buyer fit: ${categoryFit} teams.` : "",
      `${Math.round((reviews.filter((review) => review.verifiedReviewer).length / reviews.length) * 100)}% of reviews come from verified reviewers.`
    ].filter(Boolean)
  };
}
