export const ANALYTICS_EVENTS = {
  directoryListingImpression: "directory_listing_impression",
  directoryProfileClick: "directory_profile_click",
  directoryOutboundClick: "directory_outbound_click",
  toolProfileView: "tool_profile_view",
  toolOutboundClick: "tool_outbound_click"
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export const TRAFFIC_EVENTS: AnalyticsEventName[] = [
  ANALYTICS_EVENTS.directoryListingImpression,
  ANALYTICS_EVENTS.directoryProfileClick,
  ANALYTICS_EVENTS.toolProfileView
];

export const OUTBOUND_EVENTS: AnalyticsEventName[] = [
  ANALYTICS_EVENTS.directoryOutboundClick,
  ANALYTICS_EVENTS.toolOutboundClick
];
