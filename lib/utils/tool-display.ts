import type { Tool } from "@/types/domain";

/** Avoid showing raw URLs or duplicate names as the card subtitle. */
function isLowQualityCardText(text: string, toolName: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    return true;
  }

  if (/^https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed)) {
    return true;
  }

  const normalized = trimmed.replace(/\s+/g, "").toLowerCase();
  const name = toolName.replace(/\s+/g, "").toLowerCase();
  if (normalized === name) {
    return true;
  }

  if (name.length >= 3 && normalized.length >= name.length * 2 && normalized.replaceAll(name, "").length === 0) {
    return true;
  }

  return false;
}

export function getToolCardSubtitle(tool: Tool) {
  const tagline = tool.tagline?.trim() ?? "";

  if (tagline && !isLowQualityCardText(tagline, tool.name)) {
    return tagline;
  }

  const fromDescription = tool.description?.trim() ?? "";
  if (fromDescription && !isLowQualityCardText(fromDescription, tool.name)) {
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
