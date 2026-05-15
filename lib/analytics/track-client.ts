"use client";

import type { AnalyticsEventName } from "@/lib/analytics/constants";

function getSessionId() {
  if (typeof window === "undefined") {
    return undefined;
  }

  const key = "theaistack_analytics_session";
  const existing = window.sessionStorage.getItem(key);
  if (existing) {
    return existing;
  }

  const created = crypto.randomUUID();
  window.sessionStorage.setItem(key, created);
  return created;
}

export function trackAnalyticsEvent(
  eventName: AnalyticsEventName,
  toolId: string,
  properties?: Record<string, string | number | boolean | null>
) {
  void fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      eventName,
      toolId,
      sessionId: getSessionId(),
      properties
    })
  }).catch(() => undefined);
}
