"use client";

import { useEffect, useRef } from "react";
import { ANALYTICS_EVENTS } from "@/lib/analytics/constants";
import { trackAnalyticsEvent } from "@/lib/analytics/track-client";

export function ToolProfileViewTracker({ toolId }: { toolId: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) {
      return;
    }

    tracked.current = true;
    trackAnalyticsEvent(ANALYTICS_EVENTS.toolProfileView, toolId, { source: "tool_profile" });
  }, [toolId]);

  return null;
}
