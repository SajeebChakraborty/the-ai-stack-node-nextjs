export const BULK_CLAIM_HEADERS = [
  "user_id",
  "founder_id",
  "name",
  "slug",
  "tagline",
  "description",
  "website_url",
  "affiliate_url",
  "logo_url",
  "categories",
  "features",
  "pricing_model",
  "starting_price",
  "screenshot_urls",
  "promo_video_url",
  "video_urls",
  "social_x",
  "social_linkedin",
  "social_youtube",
  "social_discord"
] as const;

export type BulkClaimHeader = (typeof BULK_CLAIM_HEADERS)[number];
