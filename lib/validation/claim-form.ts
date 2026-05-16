import { filterDisplayFeatures } from "@/lib/utils/display-features";
import { filterLikelyImageUrls, isLikelyImageUrl, isYoutubeOrVideoUrl } from "@/lib/utils/tool-logo";

export type ClaimFormValues = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  websiteUrl: string;
  affiliateUrl: string;
  logoUrl: string;
  categories: string;
  features: string;
  pricingModel: string;
  startingPrice: string;
  screenshotUrls: string;
  promoVideoUrl: string;
  videoUrls: string;
  socialX: string;
  socialLinkedIn: string;
  socialYouTube: string;
  socialDiscord: string;
};

function parseListInput(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isValidUrl(value: string) {
  if (!value.trim()) {
    return true;
  }

  try {
    new URL(value.trim());
    return true;
  } catch {
    return false;
  }
}

export function validateClaimForm(values: ClaimFormValues): string[] {
  const errors: string[] = [];
  const name = values.name.trim();
  const slug = values.slug.trim().toLowerCase();
  const tagline = values.tagline.trim();
  const description = values.description.trim();
  const websiteUrl = values.websiteUrl.trim();
  const categories = values.categories.trim();

  if (name.length < 2) {
    errors.push("Tool name must be at least 2 characters.");
  }

  if (slug.length < 2) {
    errors.push("Slug is required (for example clipnova).");
  } else if (!/^[a-z0-9-]+$/.test(slug)) {
    errors.push("Slug must use lowercase letters, numbers, and hyphens only.");
  }

  if (tagline.length < 4) {
    errors.push("Tagline must be at least 4 characters.");
  }

  if (description.length < 20) {
    errors.push("Description must be at least 20 characters.");
  }

  if (!websiteUrl) {
    errors.push("Primary website link is required.");
  } else if (!isValidUrl(websiteUrl)) {
    errors.push("Primary website link must be a valid URL.");
  }

  if (!categories) {
    errors.push("Add at least one category.");
  }

  if (values.affiliateUrl.trim() && !isValidUrl(values.affiliateUrl)) {
    errors.push("Affiliate link must be a valid URL.");
  }

  if (values.logoUrl.trim()) {
    if (!isValidUrl(values.logoUrl)) {
      errors.push("Logo image URL must be a valid URL.");
    } else if (isYoutubeOrVideoUrl(values.logoUrl)) {
      errors.push("Logo must be a direct image link (PNG, JPG, WebP, etc.), not a YouTube or video page URL.");
    } else if (!isLikelyImageUrl(values.logoUrl)) {
      errors.push("Logo must link to an image file (for example .png or .jpg) or an uploaded image URL.");
    }
  }

  if (values.socialX.trim() && !isValidUrl(values.socialX)) {
    errors.push("X profile URL must be a valid URL.");
  }

  if (values.socialLinkedIn.trim() && !isValidUrl(values.socialLinkedIn)) {
    errors.push("LinkedIn profile URL must be a valid URL.");
  }

  if (values.socialYouTube.trim() && !isValidUrl(values.socialYouTube)) {
    errors.push("YouTube channel URL must be a valid URL.");
  }

  if (values.socialDiscord.trim() && !isValidUrl(values.socialDiscord)) {
    errors.push("Discord invite URL must be a valid URL.");
  }

  const startingPrice = Number(values.startingPrice);
  if (!Number.isFinite(startingPrice) || startingPrice < 0) {
    errors.push("Starting price must be zero or greater.");
  }

  const featureItems = parseListInput(values.features);
  const invalidFeatures = featureItems.filter((feature) => {
    try {
      return new URL(feature).protocol === "http:" || new URL(feature).protocol === "https:";
    } catch {
      return false;
    }
  });
  if (invalidFeatures.length) {
    errors.push("Features must be short product capabilities, not website or video URLs.");
  }

  if (featureItems.length > 0 && filterDisplayFeatures(featureItems).length === 0) {
    errors.push("Add at least one valid product feature.");
  }

  const screenshotUrls = parseListInput(values.screenshotUrls);
  const invalidScreenshots = screenshotUrls.filter((url) => !isLikelyImageUrl(url));
  if (invalidScreenshots.length) {
    errors.push("Screenshot URLs must be direct image links (PNG, JPG, WebP, etc.), not product or homepage links.");
  }

  if (values.promoVideoUrl.trim() && !isValidUrl(values.promoVideoUrl)) {
    errors.push("Promo video link must be a valid URL (YouTube, Vimeo, or embed link).");
  }

  const extraVideoUrls = parseListInput(values.videoUrls);
  const invalidExtraVideos = extraVideoUrls.filter((url) => !isValidUrl(url));
  if (invalidExtraVideos.length) {
    errors.push("Additional video links must be valid URLs.");
  }

  return errors;
}
