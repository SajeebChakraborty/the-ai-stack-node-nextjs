export type Role = "user" | "creator" | "founder" | "moderator" | "admin";

export type PricingModel = "free" | "freemium" | "paid" | "usage-based" | "enterprise";

export type Tool = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  logoUrl: string;
  websiteUrl: string;
  affiliateUrl: string;
  categories: string[];
  features: string[];
  pricingModel: PricingModel;
  startingPrice: number;
  rating: number;
  reviewCount: number;
  trustScore: number;
  trendingScore: number;
  growthRate: number;
  verified: boolean;
  launchedAt: string;
  founder: {
    name: string;
    title: string;
    avatarUrl: string;
    companyStage: string;
    location: string;
  };
  screenshots: string[];
  videos: { title: string; embedUrl: string; duration: string }[];
  socials: Record<"x" | "linkedin" | "youtube" | "discord", string>;
  faqs: { question: string; answer: string }[];
};

export type Review = {
  id: string;
  toolSlug: string;
  author: string;
  authorHandle: string;
  authorAvatar: string;
  type: "user" | "creator" | "founder" | "verified-social" | "editorial";
  rating: number;
  title: string;
  body: string;
  helpful: number;
  trustScore: number;
  verifiedReviewer: boolean;
  createdAt: string;
};

export type Creator = {
  id: string;
  handle: string;
  name: string;
  avatarUrl: string;
  niche: string;
  followers: number;
  trustScore: number;
  monthlyEarnings: number;
  verifiedChannels: string[];
  rank: number;
};

export type PremiumPlan = {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  badge?: "Popular" | "Recommended" | "Best Value";
  features: string[];
  limits: Record<string, number | string>;
  stripeProductId: string;
  stripeMonthlyPriceId: string;
  stripeYearlyPriceId: string;
  enabled: boolean;
};

export type NewsArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  publishedAt: string;
  readTime: string;
};

export type SiteSettings = {
  title: string;
  description: string;
  logoUrl: string;
  faviconUrl: string;
  footer: string;
  socials: Record<"x" | "youtube" | "linkedin" | "discord", string>;
  maintenanceMode: boolean;
  analyticsProvider: "posthog" | "plausible";
};
