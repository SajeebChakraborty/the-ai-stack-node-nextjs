"use client";

import { useEffect, useRef } from "react";
import { ANALYTICS_EVENTS } from "@/lib/analytics/constants";
import { trackAnalyticsEvent } from "@/lib/analytics/track-client";

export function ToolListingTracker({
  toolId,
  source = "directory"
}: {
  toolId: string;
  source?: "directory" | "home" | "search";
}) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) {
      return;
    }

    tracked.current = true;
    trackAnalyticsEvent(ANALYTICS_EVENTS.directoryListingImpression, toolId, { source });
  }, [toolId, source]);

  return null;
}

export function trackDirectoryProfileClick(toolId: string, source = "directory") {
  trackAnalyticsEvent(ANALYTICS_EVENTS.directoryProfileClick, toolId, { source });
}

export function trackDirectoryOutboundClick(toolId: string, source = "directory") {
  trackAnalyticsEvent(ANALYTICS_EVENTS.directoryOutboundClick, toolId, { source });
}

export function trackToolOutboundClick(toolId: string) {
  trackAnalyticsEvent(ANALYTICS_EVENTS.toolOutboundClick, toolId, { source: "tool_profile" });
}
