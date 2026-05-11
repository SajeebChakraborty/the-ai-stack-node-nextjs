import { categories, creators, news, premiumPlans, reviews, siteSettings, tools } from "@/data/catalog";

export async function getAdminOverview() {
  const monthlyRecurringRevenue = premiumPlans.reduce((total, plan) => total + plan.monthlyPrice * (plan.id === "free" ? 0 : 14), 0);
  const reviewQueue = reviews.filter((review) => review.trustScore < 90).length;

  return {
    metrics: [
      { label: "Published tools", value: tools.length, change: "+18%" },
      { label: "Verified creators", value: creators.length, change: "+11%" },
      { label: "MRR", value: `$${monthlyRecurringRevenue.toLocaleString()}`, change: "+24%" },
      { label: "Review queue", value: reviewQueue, change: "-9%" }
    ],
    tools,
    reviews,
    creators,
    categories,
    premiumPlans,
    news,
    siteSettings,
    subscriptions: [
      { company: "StackPilot", plan: "Growth", status: "active", renewal: "2026-06-08", mrr: 99 },
      { company: "ContractLens", plan: "Authority", status: "active", renewal: "2026-06-12", mrr: 999 },
      { company: "ClipNova", plan: "Starter", status: "trialing", renewal: "2026-05-25", mrr: 29 }
    ],
    launchCampaigns: [
      { name: "Agent Week", status: "scheduled", startsAt: "2026-05-18", bookedSponsors: 6 },
      { name: "AI Video Stack", status: "live", startsAt: "2026-05-05", bookedSponsors: 4 }
    ],
    analytics: {
      traffic: 184_200,
      outboundClicks: 32_880,
      conversionRate: 7.4,
      creatorAttributedRevenue: 128_900
    }
  };
}
