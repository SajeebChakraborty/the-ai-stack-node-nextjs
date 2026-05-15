import "server-only";

import { prisma } from "@/lib/db/prisma";
import { OUTBOUND_EVENTS, TRAFFIC_EVENTS } from "@/lib/analytics/constants";

export type ToolEngagementMetrics = {
  growthRate: number;
  trendingScore: number;
  trustScore: number;
};

function toCountMap(rows: Array<{ toolId: string | null; _count: { _all: number } }>) {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (row.toolId) {
      map.set(row.toolId, row._count._all);
    }
  }
  return map;
}

async function countEventsByTool({
  eventNames,
  from,
  to,
  toolIds
}: {
  eventNames: string[];
  from: Date;
  to?: Date;
  toolIds: string[];
}) {
  if (!toolIds.length) {
    return new Map<string, number>();
  }

  const rows = await prisma.analyticsEvent.groupBy({
    by: ["toolId"],
    where: {
      toolId: { in: toolIds },
      eventName: { in: eventNames },
      createdAt: to ? { gte: from, lt: to } : { gte: from }
    },
    _count: {
      _all: true
    }
  });

  return toCountMap(rows);
}

function computeGrowthRate(current: number, previous: number) {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function computeTrendingScore({
  outbound30,
  rating,
  reviewCount,
  traffic30,
  verified
}: {
  outbound30: number;
  rating: number;
  reviewCount: number;
  traffic30: number;
  verified: boolean;
}) {
  const raw = traffic30 * 2.5 + outbound30 * 4 + reviewCount * 10 + rating * 8 + (verified ? 15 : 0);
  return Math.min(100, Math.round(raw));
}

function computeTrustScore({
  conversionRate,
  founderTrust,
  founderVerified,
  rating,
  reviewCount,
  verified
}: {
  conversionRate: number;
  founderTrust: number;
  founderVerified: boolean;
  rating: number;
  reviewCount: number;
  verified: boolean;
}) {
  const base = 35 + Math.min(20, founderTrust * 0.2);
  const listingProof = (verified ? 15 : 0) + (founderVerified ? 10 : 0);
  const reviews = Math.min(20, reviewCount * 5) + Math.min(10, rating * 2);
  const engagement = Math.min(15, conversionRate * 0.35);

  return Math.min(100, Math.max(0, Math.round(base + listingProof + reviews + engagement)));
}

export async function computeToolEngagementMetrics(toolIds: string[]): Promise<Map<string, ToolEngagementMetrics>> {
  const uniqueIds = [...new Set(toolIds.filter(Boolean))];
  const result = new Map<string, ToolEngagementMetrics>();

  if (!uniqueIds.length) {
    return result;
  }

  const now = new Date();
  const since7 = new Date(now);
  since7.setDate(since7.getDate() - 7);
  const since14 = new Date(now);
  since14.setDate(since14.getDate() - 14);
  const since30 = new Date(now);
  since30.setDate(since30.getDate() - 30);

  const [tools, traffic7, trafficPrev7, traffic30, outbound30] = await Promise.all([
    prisma.tool.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        verified: true,
        reviewCount: true,
        ratingAvg: true,
        founder: {
          select: {
            trustScore: true,
            founderProfile: {
              select: { verifiedAt: true }
            }
          }
        }
      }
    }),
    countEventsByTool({ toolIds: uniqueIds, eventNames: TRAFFIC_EVENTS, from: since7 }),
    countEventsByTool({ toolIds: uniqueIds, eventNames: TRAFFIC_EVENTS, from: since14, to: since7 }),
    countEventsByTool({ toolIds: uniqueIds, eventNames: TRAFFIC_EVENTS, from: since30 }),
    countEventsByTool({ toolIds: uniqueIds, eventNames: OUTBOUND_EVENTS, from: since30 })
  ]);

  for (const tool of tools) {
    const currentTraffic = traffic7.get(tool.id) ?? 0;
    const previousTraffic = trafficPrev7.get(tool.id) ?? 0;
    const monthTraffic = traffic30.get(tool.id) ?? 0;
    const monthOutbound = outbound30.get(tool.id) ?? 0;
    const rating = Number(tool.ratingAvg);
    const conversionRate = monthTraffic > 0 ? (monthOutbound / monthTraffic) * 100 : 0;

    const metrics: ToolEngagementMetrics = {
      trendingScore: computeTrendingScore({
        traffic30: monthTraffic,
        outbound30: monthOutbound,
        reviewCount: tool.reviewCount,
        rating,
        verified: tool.verified
      }),
      growthRate: computeGrowthRate(currentTraffic, previousTraffic),
      trustScore: computeTrustScore({
        conversionRate,
        founderTrust: tool.founder?.trustScore ?? 50,
        founderVerified: Boolean(tool.founder?.founderProfile?.verifiedAt),
        rating,
        reviewCount: tool.reviewCount,
        verified: tool.verified
      })
    };

    result.set(tool.id, metrics);
  }

  return result;
}

export async function syncToolEngagementMetrics(toolIds: string[]) {
  const metricsMap = await computeToolEngagementMetrics(toolIds);

  await Promise.all(
    [...metricsMap.entries()].map(([toolId, metrics]) =>
      prisma.tool.update({
        where: { id: toolId },
        data: {
          trendingScore: metrics.trendingScore,
          growthRate: metrics.growthRate,
          trustScore: metrics.trustScore
        }
      })
    )
  );

  return metricsMap;
}

export function applyToolEngagementMetrics<T extends { id: string; growthRate: number; trendingScore: number; trustScore: number }>(
  tool: T,
  metricsMap: Map<string, ToolEngagementMetrics>
): T {
  const metrics = metricsMap.get(tool.id);
  if (!metrics) {
    return tool;
  }

  return {
    ...tool,
    trendingScore: metrics.trendingScore,
    growthRate: metrics.growthRate,
    trustScore: metrics.trustScore
  };
}
