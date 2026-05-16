import "server-only";

import { prisma } from "@/lib/db/prisma";
import { OUTBOUND_EVENTS, TRAFFIC_EVENTS } from "@/lib/analytics/constants";

const periodDays = 30;

const trafficEventSet = new Set<string>(TRAFFIC_EVENTS);
const outboundEventSet = new Set<string>(OUTBOUND_EVENTS);

function periodStart() {
  const start = new Date();
  start.setDate(start.getDate() - periodDays);
  return start;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toChartLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export type FounderDashboardChartPoint = {
  date: string;
  label: string;
  traffic: number;
  outboundClicks: number;
};

function buildEmptyChartSeries(days: number): FounderDashboardChartPoint[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: days }, (_, index) => {
    const day = new Date(today);
    day.setDate(day.getDate() - (days - 1 - index));
    return {
      date: toDateKey(day),
      label: toChartLabel(day),
      traffic: 0,
      outboundClicks: 0
    };
  });
}

function buildChartSeriesFromEvents(
  events: Array<{ createdAt: Date; eventName: string }>,
  days: number
): FounderDashboardChartPoint[] {
  const series = buildEmptyChartSeries(days);
  const indexByDate = new Map(series.map((point, index) => [point.date, index]));

  for (const event of events) {
    const key = toDateKey(event.createdAt);
    const index = indexByDate.get(key);
    if (index === undefined) {
      continue;
    }

    if (trafficEventSet.has(event.eventName)) {
      series[index].traffic += 1;
    } else if (outboundEventSet.has(event.eventName)) {
      series[index].outboundClicks += 1;
    }
  }

  return series;
}

export type FounderDashboardMetrics = {
  traffic: number;
  outboundClicks: number;
  conversionRate: number;
  seoKeywords: number;
  publishedClaims: number;
  periodDays: number;
  chartSeries: FounderDashboardChartPoint[];
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
      periodDays,
      chartSeries: buildEmptyChartSeries(periodDays)
    };
  }

  const categoryNames = new Set<string>();
  for (const tool of founderTools) {
    for (const link of tool.categories) {
      categoryNames.add(link.category.name);
    }
  }

  const chartEventNames = [...TRAFFIC_EVENTS, ...OUTBOUND_EVENTS];

  const [traffic, outboundClicks, chartEvents] = await Promise.all([
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
    }),
    prisma.analyticsEvent.findMany({
      where: {
        toolId: { in: toolIds },
        eventName: { in: chartEventNames },
        createdAt: { gte: since }
      },
      select: {
        createdAt: true,
        eventName: true
      },
      orderBy: { createdAt: "asc" }
    })
  ]);

  const conversionRate = traffic > 0 ? Number(((outboundClicks / traffic) * 100).toFixed(1)) : 0;

  return {
    traffic,
    outboundClicks,
    conversionRate,
    seoKeywords: categoryNames.size,
    publishedClaims,
    periodDays,
    chartSeries: buildChartSeriesFromEvents(chartEvents, periodDays)
  };
}
