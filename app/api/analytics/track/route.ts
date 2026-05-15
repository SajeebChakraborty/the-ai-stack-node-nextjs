import { NextResponse } from "next/server";
import { z } from "zod";
import { ANALYTICS_EVENTS } from "@/lib/analytics/constants";
import { recordAnalyticsEvent } from "@/lib/analytics/record";
import { getCurrentUser } from "@/lib/auth/session";

const trackSchema = z.object({
  eventName: z.enum([
    ANALYTICS_EVENTS.directoryListingImpression,
    ANALYTICS_EVENTS.directoryProfileClick,
    ANALYTICS_EVENTS.directoryOutboundClick,
    ANALYTICS_EVENTS.toolProfileView,
    ANALYTICS_EVENTS.toolOutboundClick
  ]),
  toolId: z.string().min(1),
  sessionId: z.string().max(120).optional(),
  properties: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional()
});

export async function POST(request: Request) {
  const payload = trackSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid analytics payload." }, { status: 400 });
  }

  const user = await getCurrentUser();

  await recordAnalyticsEvent({
    eventName: payload.data.eventName,
    toolId: payload.data.toolId,
    userId: user?.id,
    sessionId: payload.data.sessionId,
    properties: payload.data.properties
  });

  return NextResponse.json({ ok: true });
}
