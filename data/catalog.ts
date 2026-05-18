import type { Creator, NewsArticle, PremiumPlan, Review, SiteSettings, Tool } from "@/types/domain";

export const categories = [
  "Agents",
  "Coding",
  "Design",
  "Marketing",
  "Sales",
  "Search",
  "Video",
  "Voice",
  "Analytics",
  "Security",
  "Productivity",
  "Enterprise"
];

export const tools: Tool[] = [
  {
    id: "tool_stackpilot",
    slug: "stackpilot",
    name: "StackPilot",
    tagline: "Autonomous product analyst for SaaS growth teams.",
    description:
      "StackPilot combines session intelligence, customer feedback, and competitive monitoring into a single AI analyst that writes growth briefs every morning.",
    logoUrl: "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?auto=format&fit=crop&w=180&q=80",
    websiteUrl: "https://example.com/stackpilot",
    affiliateUrl: "https://example.com/stackpilot?ref=theaistack",
    categories: ["Analytics", "Marketing", "Enterprise"],
    features: ["AI growth briefs", "Competitor monitoring", "CRM enrichment", "Executive dashboards"],
    pricingModel: "paid",
    startingPrice: 89,
    rating: 4.8,
    reviewCount: 184,
    trustScore: 94,
    trendingScore: 98,
    growthRate: 42,
    verified: true,
    launchedAt: "2026-02-08",
    founder: {
      name: "Mira Kapoor",
      title: "Founder & CEO",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=180&q=80",
      companyStage: "Series A",
      location: "New York"
    },
    screenshots: [
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1400&q=80"
    ],
    videos: [{ title: "StackPilot founder walkthrough", embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "8:14" }],
    socials: {
      x: "https://x.com/stackpilot",
      linkedin: "https://linkedin.com/company/stackpilot",
      youtube: "https://youtube.com/@stackpilot",
      discord: "https://discord.gg/stackpilot"
    },
    faqs: [
      { question: "Who is StackPilot best for?", answer: "B2B SaaS teams with product-led growth, sales-assisted funnels, and active review channels." },
      { question: "Does it support SOC 2 exports?", answer: "Yes. Growth and higher plans include audit logs, SSO, and security evidence export." }
    ]
  },
  {
    id: "tool_promptforge",
    slug: "promptforge",
    name: "PromptForge",
    tagline: "Governed prompt operations for enterprise AI teams.",
    description:
      "PromptForge gives AI teams version control, evaluations, approval workflows, and production observability for prompts, agents, and model chains.",
    logoUrl: "https://images.unsplash.com/photo-1600267165477-6d4cc741b379?auto=format&fit=crop&w=180&q=80",
    websiteUrl: "https://example.com/promptforge",
    affiliateUrl: "https://example.com/promptforge?ref=theaistack",
    categories: ["Agents", "Enterprise", "Security"],
    features: ["Prompt registry", "Human approval flows", "Eval suites", "PII guardrails"],
    pricingModel: "enterprise",
    startingPrice: 499,
    rating: 4.7,
    reviewCount: 96,
    trustScore: 91,
    trendingScore: 87,
    growthRate: 28,
    verified: true,
    launchedAt: "2025-11-17",
    founder: {
      name: "Theo Alvarez",
      title: "Co-founder",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=180&q=80",
      companyStage: "Seed",
      location: "San Francisco"
    },
    screenshots: [
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1400&q=80"
    ],
    videos: [{ title: "Prompt governance in production", embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "11:02" }],
    socials: {
      x: "https://x.com/promptforge",
      linkedin: "https://linkedin.com/company/promptforge",
      youtube: "https://youtube.com/@promptforge",
      discord: "https://discord.gg/promptforge"
    },
    faqs: [
      { question: "Can PromptForge run on private clouds?", answer: "Enterprise customers can deploy in a dedicated Supabase project and connect private model gateways." },
      { question: "How are prompts reviewed?", answer: "Every prompt version can require owner approval, legal review, and automated eval thresholds." }
    ]
  },
  {
    id: "tool_clipnova",
    slug: "clipnova",
    name: "ClipNova",
    tagline: "AI shorts studio for creators and launch teams.",
    description:
      "ClipNova turns long interviews, webinars, and product demos into platform-ready shorts with hooks, captions, A/B variants, and affiliate tracking.",
    logoUrl: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&w=180&q=80",
    websiteUrl: "https://example.com/clipnova",
    affiliateUrl: "https://example.com/clipnova?ref=theaistack",
    categories: ["Video", "Marketing", "Creator"],
    features: ["Auto clipping", "Caption templates", "Creator affiliate links", "Publishing queue"],
    pricingModel: "freemium",
    startingPrice: 19,
    rating: 4.6,
    reviewCount: 312,
    trustScore: 88,
    trendingScore: 93,
    growthRate: 61,
    verified: true,
    launchedAt: "2026-03-21",
    founder: {
      name: "Nadia Ivers",
      title: "Founder",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=180&q=80",
      companyStage: "Bootstrapped",
      location: "Austin"
    },
    screenshots: [
      "https://images.unsplash.com/photo-1611162616305-c69b3037f199?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1616469829581-73993eb86b02?auto=format&fit=crop&w=1400&q=80"
    ],
    videos: [{ title: "From launch call to 20 shorts", embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "5:39" }],
    socials: {
      x: "https://x.com/clipnova",
      linkedin: "https://linkedin.com/company/clipnova",
      youtube: "https://youtube.com/@clipnova",
      discord: "https://discord.gg/clipnova"
    },
    faqs: [
      { question: "Which platforms are supported?", answer: "YouTube Shorts, TikTok, Instagram Reels, LinkedIn video, and X native video." },
      { question: "Can creators earn commission?", answer: "Yes. TheAiStack affiliate attribution can be added to every exported launch asset." }
    ]
  },
  {
    id: "tool_contractlens",
    slug: "contractlens",
    name: "ContractLens",
    tagline: "AI contract triage for procurement and legal teams.",
    description:
      "ContractLens reviews vendor agreements, highlights risk, compares clauses against playbooks, and creates negotiation briefs for legal operations.",
    logoUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=180&q=80",
    websiteUrl: "https://example.com/contractlens",
    affiliateUrl: "https://example.com/contractlens?ref=theaistack",
    categories: ["Enterprise", "Security", "Productivity"],
    features: ["Clause risk scoring", "Playbook comparison", "Vendor history", "Redline suggestions"],
    pricingModel: "paid",
    startingPrice: 149,
    rating: 4.9,
    reviewCount: 73,
    trustScore: 96,
    trendingScore: 84,
    growthRate: 19,
    verified: true,
    launchedAt: "2025-09-12",
    founder: {
      name: "Iris Chen",
      title: "CEO",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=180&q=80",
      companyStage: "Series B",
      location: "London"
    },
    screenshots: [
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80"
    ],
    videos: [{ title: "Legal ops review demo", embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "7:48" }],
    socials: {
      x: "https://x.com/contractlens",
      linkedin: "https://linkedin.com/company/contractlens",
      youtube: "https://youtube.com/@contractlens",
      discord: "https://discord.gg/contractlens"
    },
    faqs: [
      { question: "Does it replace legal review?", answer: "No. It accelerates first-pass triage and negotiation prep while keeping attorneys in control." },
      { question: "Can playbooks be customized?", answer: "Yes. Founders and admins can upload policy templates and clause preferences." }
    ]
  }
];

export const reviews: Review[] = [
  {
    id: "rev_1",
    toolSlug: "stackpilot",
    author: "Jordan Lee",
    authorHandle: "jordanbuilds",
    authorAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
    type: "verified-social",
    rating: 5,
    title: "The first analytics tool my CEO actually reads daily",
    body: "The daily growth memo is concise, sourced, and surprisingly good at finding conversion issues before our weekly growth meeting.",
    helpful: 84,
    trustScore: 92,
    verifiedReviewer: true,
    createdAt: "2026-04-12"
  },
  {
    id: "rev_2",
    toolSlug: "promptforge",
    author: "Elena Morris",
    authorHandle: "elenaml",
    authorAvatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&q=80",
    type: "editorial",
    rating: 4,
    title: "Strong governance model with mature eval workflows",
    body: "PromptForge is strongest when multiple teams ship model workflows and compliance needs a clear approval trail.",
    helpful: 61,
    trustScore: 97,
    verifiedReviewer: true,
    createdAt: "2026-03-29"
  },
  {
    id: "rev_3",
    toolSlug: "clipnova",
    author: "Sam Rivera",
    authorHandle: "samlaunches",
    authorAvatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=120&q=80",
    type: "creator",
    rating: 5,
    title: "Launch clips went from chore to revenue channel",
    body: "Caption quality, hooks, and affiliate tracking made it viable to publish more without hiring a video editor.",
    helpful: 133,
    trustScore: 89,
    verifiedReviewer: true,
    createdAt: "2026-04-22"
  }
];

export const creators: Creator[] = [
  {
    id: "creator_1",
    handle: "morganai",
    name: "Morgan Shah",
    avatarUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=160&q=80",
    niche: "AI workflows for operators",
    followers: 248000,
    trustScore: 96,
    monthlyEarnings: 18420,
    verifiedChannels: ["YouTube", "X", "LinkedIn"],
    rank: 1
  },
  {
    id: "creator_2",
    handle: "devwithkai",
    name: "Kai Okafor",
    avatarUrl: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=160&q=80",
    niche: "AI coding tools",
    followers: 188000,
    trustScore: 93,
    monthlyEarnings: 12780,
    verifiedChannels: ["YouTube", "Discord", "GitHub"],
    rank: 2
  }
];

export const premiumPlans: PremiumPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Explore the directory, bookmark tools, and publish community reviews.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: ["10 bookmarks", "Community reviews", "Weekly AI digest"],
    limits: { bookmarks: 10, claimedListings: 0, courses: 0, analyticsDays: 0 },
    stripeProductId: "",
    stripeMonthlyPriceId: "",
    stripeYearlyPriceId: "",
    enabled: true
  },
  {
    id: "starter",
    name: "Starter",
    description: "Claim one listing and add richer media, updates, and conversion tracking.",
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: ["1 claimed listing", "Launch updates", "Basic analytics", "Founder replies"],
    limits: { claimedListings: 1, courses: 5, mediaUploads: 20, analyticsDays: 30 },
    stripeProductId: "prod_starter",
    stripeMonthlyPriceId: "price_starter_monthly",
    stripeYearlyPriceId: "price_starter_yearly",
    enabled: true
  },
  {
    id: "growth",
    name: "Growth",
    description: "Scale listings, sponsorships, creator campaigns, and SEO intelligence.",
    monthlyPrice: 99,
    yearlyPrice: 990,
    badge: "Popular",
    features: ["5 claimed listings", "Competitor insights", "Creator sponsorships", "Priority ranking signals"],
    limits: { claimedListings: 5, courses: 20, mediaUploads: 100, analyticsDays: 180 },
    stripeProductId: "prod_growth",
    stripeMonthlyPriceId: "price_growth_monthly",
    stripeYearlyPriceId: "price_growth_yearly",
    enabled: true
  },
  {
    id: "pro",
    name: "Pro",
    description: "For portfolio companies and agencies managing serious launch programs.",
    monthlyPrice: 299,
    yearlyPrice: 2990,
    badge: "Recommended",
    features: ["20 claimed listings", "Advanced SEO", "Launch campaign manager", "Revenue attribution"],
    limits: { claimedListings: 20, courses: 50, mediaUploads: 500, analyticsDays: 365 },
    stripeProductId: "prod_pro",
    stripeMonthlyPriceId: "price_pro_monthly",
    stripeYearlyPriceId: "price_pro_yearly",
    enabled: true
  },
  {
    id: "authority",
    name: "Authority",
    description: "Enterprise marketplace presence, executive insights, and white-glove campaigns.",
    monthlyPrice: 999,
    yearlyPrice: 9990,
    badge: "Best Value",
    features: ["Unlimited listings", "Dedicated launch strategist", "Custom analytics exports", "SLA support"],
    limits: { claimedListings: "unlimited", courses: "unlimited", mediaUploads: "unlimited", analyticsDays: 730 },
    stripeProductId: "prod_authority",
    stripeMonthlyPriceId: "price_authority_monthly",
    stripeYearlyPriceId: "price_authority_yearly",
    enabled: true
  }
];

export const news: NewsArticle[] = [
  {
    id: "news_1",
    slug: "agentic-crm-stack",
    title: "Agentic CRM stacks are moving from pilots to revenue teams",
    excerpt: "New launch data shows a sharp rise in AI tools that combine enrichment, workflow execution, and coaching.",
    category: "Market Map",
    author: "TheAiStack Editorial",
    publishedAt: "2026-04-30",
    readTime: "5 min"
  },
  {
    id: "news_2",
    slug: "creator-led-ai-launches",
    title: "Creator-led AI launches are becoming a repeatable growth channel",
    excerpt: "Verified reviewers with high trust scores now influence ranking lift and conversion quality across launches.",
    category: "Creator Economy",
    author: "Rina Patel",
    publishedAt: "2026-04-27",
    readTime: "7 min"
  }
];

export const siteSettings: SiteSettings = {
  title: "TheAiStack",
  description: "Discover, review, rank, and monetize the world's best AI tools.",
  logoUrl: "/logo.svg",
  faviconUrl: "/favicon.ico",
  footer: "The operating layer for AI discovery, trust, creators, and launch intelligence.",
  socials: {
    x: "https://x.com/theaistack",
    youtube: "https://youtube.com/@theaistack",
    linkedin: "https://linkedin.com/company/theaistack",
    discord: "https://discord.gg/theaistack"
  },
  maintenanceMode: false,
  analyticsProvider: "posthog"
};
