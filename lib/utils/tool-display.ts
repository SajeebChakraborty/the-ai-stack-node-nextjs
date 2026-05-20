import type { Tool } from "@/types/domain";

/** Avoid showing raw URLs or duplicate names as the card subtitle. */
export function getToolCardSubtitle(tool: Tool) {
  const tagline = tool.tagline?.trim() ?? "";
  const looksLikeUrl = /^https?:\/\//i.test(tagline) || /^www\./i.test(tagline);
  const duplicatesName = tagline.toLowerCase() === tool.name.trim().toLowerCase();

  if (tagline && !looksLikeUrl && !duplicatesName) {
    return tagline;
  }

  const fromDescription = tool.description?.trim() ?? "";
  if (fromDescription) {
    return fromDescription.length > 140 ? `${fromDescription.slice(0, 137)}…` : fromDescription;
  }

  return "Explore features, pricing, and buyer reviews.";
}

export function formatToolPricing(tool: Tool) {
  if (tool.startingPrice <= 0) {
    return "Free to start";
  }

  const model =
    tool.pricingModel === "enterprise"
      ? "Enterprise"
      : tool.pricingModel === "freemium"
        ? "Freemium"
        : tool.pricingModel === "usage-based"
          ? "Usage-based"
          : tool.pricingModel === "free"
            ? "Free"
            : "Paid";

  return `From $${tool.startingPrice}/mo · ${model}`;
}

export function toolHasPromoMedia(tool: Tool) {
  return Boolean(
    tool.promoVideoUrl?.trim() ||
      tool.videos?.[0]?.embedUrl?.trim() ||
      tool.screenshots?.[0]?.trim()
  );
}
