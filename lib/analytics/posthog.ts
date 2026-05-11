"use client";

export function captureEvent(name: string, properties?: Record<string, string | number | boolean | null>) {
  if (typeof window === "undefined") return;
  const posthog = (window as typeof window & { posthog?: { capture: (event: string, properties?: object) => void } }).posthog;
  posthog?.capture(name, properties);
}
