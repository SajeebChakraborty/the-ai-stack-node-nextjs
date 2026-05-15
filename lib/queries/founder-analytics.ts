import "server-only";

import { prisma } from "@/lib/db/prisma";
import { OUTBOUND_EVENTS, TRAFFIC_EVENTS } from "@/lib/analytics/constants";

const periodDays = 30;

function periodStart() {
  const start = new Date();
  start.setDate(start.getDate() - periodDays);
  return start;
}

export type FounderDashboardMetrics = {
  traffic: number;
  outboundClicks: number;
  conversionRate: number;
  seoKeywords: number;
  publishedClaims: number;
  periodDays: number;
};

export async function getFounderDashboardMetrics(founderId: string): Promise<FounderDashboardMetrics> {
  const since = periodStart();

  const founderTools = await prisma.tool.findMany({
    where: { founderId },
    select: {
      id: true,
      status: true,
      categories: {
        select: {
          category: {
            select: { name: true }
          }
        }
      }
    }
  });

  const toolIds = founderTools.map((tool) => tool.id);
  const publishedClaims = founderTools.filter((tool) => tool.status === "published").length;

  if (!toolIds.length) {
    return {
      traffic: 0,
      outboundClicks: 0,
      conversionRate: 0,
      seoKeywords: 0,
      publishedClaims: 0,
      periodDays
    };
  }

  const categoryNames = new Set<string>();
  for (const tool of founderTools) {
    for (const link of tool.categories) {
      categoryNames.add(link.category.name);
    }
  }

  const [traffic, outboundClicks] = await Promise.all([
    prisma.analyticsEvent.count({
      where: {
        toolId: { in: toolIds },
        eventName: { in: TRAFFIC_EVENTS },
        createdAt: { gte: since }
      }
    }),
    prisma.analyticsEvent.count({
      where: {
        toolId: { in: toolIds },
        eventName: { in: OUTBOUND_EVENTS },
        createdAt: { gte: since }
      }
    })
  ]);

  const conversionRate = traffic > 0 ? Number(((outboundClicks / traffic) * 100).toFixed(1)) : 0;

  return {
    traffic,
    outboundClicks,
    conversionRate,
    seoKeywords: categoryNames.size,
    publishedClaims,
    periodDays
  };
}
