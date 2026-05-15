import type { ReviewType } from "@prisma/client";
import { OUTBOUND_EVENTS, TRAFFIC_EVENTS } from "@/lib/analytics/constants";
import { prisma } from "@/lib/db/prisma";
import { publishVerifiedFounderDrafts } from "@/lib/queries/directory";
import { categories as defaultCategories, siteSettings as defaultSiteSettings } from "@/data/catalog";
import type { Creator, Review, SiteSettings } from "@/types/domain";
import { ensurePremiumPlansSeeded, mapPremiumPlanRow } from "@/lib/queries/plans";
import { formatChangePercent, formatCurrency, periodBounds, toNumber } from "@/lib/queries/admin-metrics";
import { getAdminMembers } from "@/lib/queries/admin-members";
import { getPublicStripeSettings } from "@/lib/stripe/config";
import type { AdminMember } from "@/types/admin";

type AdminReview = Pick<Review, "title" | "type" | "rating" | "trustScore">;

function mapReviewType(reviewType: ReviewType): AdminReview["type"] {
  switch (reviewType) {
    case "verified_social":
      return "verified-social";
    case "creator":
      return "creator";
    case "editorial":
      return "editorial";
    default:
      return "user";
  }
}

async function ensureCategories() {
  const count = await prisma.category.count();
  if (count > 0) {
    return;
  }

  await Promise.all(
    defaultCategories.map((name, index) => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return prisma.category.upsert({
        where: { slug },
        update: {},
        create: {
          slug,
          name,
          description: `${name} tools listed on TheAiStack.`,
          seoTitle: `${name} tools`,
          seoDescription: `Discover claimed and reviewed ${name} tools on TheAiStack.`,
          sortOrder: index
        }
      });
    })
  );
}

async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const rows = await prisma.websiteSetting.findMany();
    if (!rows.length) {
      return defaultSiteSettings;
    }

    const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    const stored = (values.site ?? values.default ?? values) as Partial<SiteSettings>;

    return {
      ...defaultSiteSettings,
      ...stored,
      socials: {
        ...defaultSiteSettings.socials,
        ...(stored.socials ?? {})
      }
    };
  } catch {
    return defaultSiteSettings;
  }
}

export async function getAdminOverview() {
  try {
    return await loadAdminOverview();
  } catch {
    return emptyAdminOverview();
  }
}

function emptyAdminOverview() {
  return {
    metrics: [
      { label: "Published tools", value: 0, change: "0 pending" },
      { label: "Verified creators", value: 0, change: "0%" },
      { label: "MRR", value: formatCurrency(0), change: "0%" },
      { label: "Review queue", value: 0, change: "0%" }
    ],
    tools: [],
    pendingClaims: [],
    reviews: [],
    creators: [],
    categories: [],
    premiumPlans: [],
    siteSettings: defaultSiteSettings,
    stripeSettings: {
      publishableKey: "",
      secretKeyMasked: null,
      webhookSecretMasked: null,
      defaultTaxRateId: "",
      configured: false,
      source: "none" as const
    },
    subscriptions: [],
    launchCampaigns: [],
    users: [],
    founders: [],
    admins: [],
    analytics: {
      traffic: 0,
      outboundClicks: 0,
      conversionRate: 0,
      creatorAttributedRevenue: 0,
      reviewsNeedingModeration: 0,
      periodDays: 30,
      totalFounders: 0,
      totalUsers: 0,
      paymentRevenue: 0
    }
  };
}

async function loadAdminOverview() {
  await Promise.all([ensurePremiumPlansSeeded(), ensureCategories(), publishVerifiedFounderDrafts()]);

  const { now, currentStart, previousStart } = periodBounds(30);

  const [
    dbTools,
    reviewRows,
    creatorRows,
    categoryRows,
    planRows,
    subscriptionRows,
    launchRows,
    pendingReviewCount,
    reviewsNeedingModeration,
    verifiedCreatorsCurrent,
    verifiedCreatorsPrevious,
    publishedToolsCurrent,
    publishedToolsPrevious,
    reviewQueueCurrent,
    reviewQueuePrevious,
    activeSubscriptions,
    profileViewCount,
    outboundClickCount,
    creatorRevenueAgg,
    affiliateRevenueAgg,
    paymentsCurrent,
    paymentsPrevious,
    verifiedCreators,
    siteSettings,
    stripeSettings
  ] = await Promise.all([
    prisma.tool.findMany({
      include: { founder: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        title: true,
        reviewType: true,
        rating: true,
        trustScore: true
      }
    }),
    prisma.creatorProfile.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            trustScore: true,
            handle: true,
            avatarUrl: true
          }
        }
      },
      orderBy: [{ leaderboardRank: "asc" }, { monthlyEarnings: "desc" }]
    }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    }),
    prisma.premiumPlan.findMany({
      orderBy: { sortOrder: "asc" }
    }),
    prisma.subscription.findMany({
      where: {
        status: { in: ["active", "trialing", "past_due"] }
      },
      include: {
        plan: true,
        user: {
          include: {
            founderProfile: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.launchCampaign.findMany({
      orderBy: { startsAt: "desc" },
      take: 20
    }),
    prisma.review.count({
      where: { moderationStatus: { not: "approved" } }
    }),
    prisma.review.count({
      where: {
        OR: [{ moderationStatus: { not: "approved" } }, { trustScore: { lt: 90 } }]
      }
    }),
    prisma.profile.count({
      where: {
        role: "creator",
        isVerified: true,
        createdAt: { gte: currentStart, lte: now }
      }
    }),
    prisma.profile.count({
      where: {
        role: "creator",
        isVerified: true,
        createdAt: { gte: previousStart, lt: currentStart }
      }
    }),
    prisma.tool.count({
      where: { status: "published", createdAt: { gte: currentStart, lte: now } }
    }),
    prisma.tool.count({
      where: { status: "published", createdAt: { gte: previousStart, lt: currentStart } }
    }),
    prisma.review.count({
      where: {
        OR: [{ moderationStatus: { not: "approved" } }, { trustScore: { lt: 90 } }],
        createdAt: { gte: currentStart, lte: now }
      }
    }),
    prisma.review.count({
      where: {
        OR: [{ moderationStatus: { not: "approved" } }, { trustScore: { lt: 90 } }],
        createdAt: { gte: previousStart, lt: currentStart }
      }
    }),
    prisma.subscription.findMany({
      where: { status: { in: ["active", "trialing"] } },
      include: { plan: true }
    }),
    prisma.analyticsEvent.count({
      where: {
        eventName: { in: [...TRAFFIC_EVENTS] },
        createdAt: { gte: currentStart, lte: now }
      }
    }),
    prisma.analyticsEvent.count({
      where: {
        eventName: { in: [...OUTBOUND_EVENTS] },
        createdAt: { gte: currentStart, lte: now }
      }
    }),
    prisma.creatorEarning.aggregate({
      _sum: { amount: true },
      where: { createdAt: { gte: currentStart, lte: now } }
    }),
    prisma.affiliateLink.aggregate({
      _sum: { revenue: true, clicks: true, conversions: true }
    }),
    prisma.payment.aggregate({
      _sum: { amountPaid: true },
      where: { createdAt: { gte: currentStart, lte: now } }
    }),
    prisma.payment.aggregate({
      _sum: { amountPaid: true },
      where: { createdAt: { gte: previousStart, lt: currentStart } }
    }),
    prisma.profile.count({
      where: { role: "creator", isVerified: true }
    }),
    getSiteSettings(),
    getPublicStripeSettings()
  ]);

  const publishedTools = dbTools.filter((tool) => tool.status === "published");
  const pendingClaims = dbTools.filter((tool) => tool.status === "draft");
  const mrr = activeSubscriptions.reduce((total, subscription) => total + toNumber(subscription.plan.monthlyPrice), 0);
  const paymentRevenueCurrent = toNumber(paymentsCurrent._sum.amountPaid) / 100;
  const paymentRevenuePrevious = toNumber(paymentsPrevious._sum.amountPaid) / 100;
  const conversionRate = profileViewCount > 0 ? (outboundClickCount / profileViewCount) * 100 : 0;
  const creatorAttributedRevenue = toNumber(creatorRevenueAgg._sum.amount) + toNumber(affiliateRevenueAgg._sum.revenue);

  const reviews: AdminReview[] = reviewRows.map((review) => ({
    title: review.title,
    type: mapReviewType(review.reviewType),
    rating: review.rating,
    trustScore: review.trustScore
  }));

  const creators: Creator[] = creatorRows.map((creator, index) => ({
    id: creator.userId,
    handle: creator.user.handle ?? creator.userId,
    name: creator.user.fullName ?? creator.user.email.split("@")[0],
    avatarUrl: creator.user.avatarUrl ?? "",
    niche: creator.niche,
    followers: creator.followerCount,
    trustScore: creator.user.trustScore,
    monthlyEarnings: toNumber(creator.monthlyEarnings),
    verifiedChannels: Array.isArray(creator.verifiedChannels) ? (creator.verifiedChannels as string[]) : [],
    rank: creator.leaderboardRank ?? index + 1
  }));

  const premiumPlans = planRows.map(mapPremiumPlanRow);
  const categories = categoryRows.length ? categoryRows.map((category) => category.name) : [];
  let members: { users: AdminMember[]; founders: AdminMember[]; admins: AdminMember[] } = {
    users: [],
    founders: [],
    admins: []
  };
  try {
    members = await getAdminMembers();
  } catch {
    members = { users: [], founders: [], admins: [] };
  }

  const totalUsers = members.users.length;
  const totalFounders = members.founders.length;

  return {
    metrics: [
      {
        label: "Published tools",
        value: publishedTools.length,
        change: `${pendingClaims.length} pending · ${publishedToolsCurrent} new (30d)`
      },
      {
        label: "Verified creators",
        value: verifiedCreators,
        change: `${verifiedCreatorsCurrent} joined (30d) · ${formatChangePercent(verifiedCreatorsCurrent, verifiedCreatorsPrevious)}`
      },
      {
        label: "MRR",
        value: formatCurrency(mrr),
        change: `${formatCurrency(paymentRevenueCurrent)} collected (30d) · ${formatChangePercent(paymentRevenueCurrent, paymentRevenuePrevious)}`
      },
      {
        label: "Review queue",
        value: pendingReviewCount,
        change: `${reviewsNeedingModeration} flagged · ${formatChangePercent(reviewQueueCurrent, reviewQueuePrevious)}`
      }
    ],
    tools: publishedTools.map((tool) => ({
      id: tool.id,
      name: tool.name,
      pricingModel: tool.pricingModel === "usage_based" ? "usage-based" : tool.pricingModel,
      reviewCount: tool.reviewCount,
      status: tool.status,
      verified: tool.verified
    })),
    pendingClaims: pendingClaims.map((tool) => ({
      id: tool.id,
      founderName: tool.founder?.fullName ?? tool.founder?.email ?? "Founder",
      name: tool.name,
      slug: tool.slug
    })),
    reviews,
    creators,
    categories,
    premiumPlans,
    siteSettings,
    stripeSettings,
    subscriptions: subscriptionRows.map((subscription) => ({
      company:
        subscription.user.founderProfile?.companyName ??
        subscription.user.fullName ??
        subscription.user.email,
      plan: subscription.plan.name,
      status: subscription.status,
      renewal: subscription.currentPeriodEnd?.toISOString().slice(0, 10) ?? "—",
      mrr: toNumber(subscription.plan.monthlyPrice)
    })),
    launchCampaigns: launchRows.map((campaign) => ({
      name: campaign.name,
      status: campaign.status,
      startsAt: campaign.startsAt.toISOString().slice(0, 10),
      bookedSponsors: campaign.bookedSponsors
    })),
    users: members.users,
    founders: members.founders,
    admins: members.admins,
    analytics: {
      traffic: profileViewCount,
      outboundClicks: outboundClickCount,
      conversionRate: Number(conversionRate.toFixed(1)),
      creatorAttributedRevenue: Math.round(creatorAttributedRevenue),
      reviewsNeedingModeration,
      periodDays: 30,
      totalFounders,
      totalUsers,
      paymentRevenue: Math.round(paymentRevenueCurrent)
    }
  };
}
