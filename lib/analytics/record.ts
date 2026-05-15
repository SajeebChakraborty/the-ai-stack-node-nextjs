import "server-only";

import { syncToolEngagementMetrics } from "@/lib/analytics/tool-metrics";
import { prisma } from "@/lib/db/prisma";
import type { AnalyticsEventName } from "@/lib/analytics/constants";

export async function recordAnalyticsEvent(input: {
  eventName: AnalyticsEventName;
  toolId?: string;
  userId?: string;
  sessionId?: string;
  properties?: Record<string, string | number | boolean | null>;
}) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        eventName: input.eventName,
        toolId: input.toolId ?? null,
        userId: input.userId ?? null,
        sessionId: input.sessionId ?? null,
        properties: input.properties ?? undefined
      }
    });

    if (input.toolId) {
      void syncToolEngagementMetrics([input.toolId]);
    }
  } catch {
    // Analytics should never block user flows.
  }
}
