export function parseClaimLimitFromLimits(limits: unknown): number | null {
  if (!limits || typeof limits !== "object" || Array.isArray(limits)) {
    return 0;
  }

  const raw = (limits as Record<string, unknown>).claimedListings;
  if (raw === "unlimited" || raw === "Unlimited") {
    return null;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function buildPlanLimits(input: {
  claimedListings?: number | string;
  limits?: Record<string, number | string>;
}) {
  const base = { ...(input.limits ?? {}) };

  if (input.claimedListings !== undefined) {
    base.claimedListings = input.claimedListings;
  }

  return base;
}

export function formatClaimLimitLabel(limit: number | null) {
  if (limit === null) {
    return "Unlimited";
  }

  return String(limit);
}
