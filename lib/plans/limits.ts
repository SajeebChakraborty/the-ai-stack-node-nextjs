export function parseNumericPlanLimit(limits: unknown, key: string): number | null {
  if (!limits || typeof limits !== "object" || Array.isArray(limits)) {
    return 0;
  }

  const raw = (limits as Record<string, unknown>)[key];
  if (raw === "unlimited" || raw === "Unlimited") {
    return null;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function parseClaimLimitFromLimits(limits: unknown): number | null {
  return parseNumericPlanLimit(limits, "claimedListings");
}

export function parseCourseLimitFromLimits(limits: unknown): number | null {
  const courses = parseNumericPlanLimit(limits, "courses");
  if (courses === 0 && limits && typeof limits === "object" && !Array.isArray(limits)) {
    const raw = (limits as Record<string, unknown>).courses;
    if (raw === undefined) {
      return 1;
    }
  }
  return courses;
}

export function buildPlanLimits(input: {
  claimedListings?: number | string;
  courses?: number | string;
  limits?: Record<string, number | string>;
}) {
  const base = { ...(input.limits ?? {}) };

  if (input.claimedListings !== undefined) {
    base.claimedListings = input.claimedListings;
  }

  if (input.courses !== undefined) {
    base.courses = input.courses;
  }

  return base;
}

export function formatCourseLimitLabel(limit: number | null) {
  if (limit === null) {
    return "Unlimited";
  }
  return String(limit);
}

export function formatClaimLimitLabel(limit: number | null) {
  if (limit === null) {
    return "Unlimited";
  }

  return String(limit);
}
