export function formatChangePercent(current: number, previous: number) {
  if (previous <= 0) {
    return current > 0 ? "+100%" : "0%";
  }

  const delta = ((current - previous) / previous) * 100;
  const rounded = Math.round(delta);
  return `${rounded >= 0 ? "+" : ""}${rounded}%`;
}

export function formatCurrency(amount: number) {
  return `$${Math.round(amount).toLocaleString()}`;
}

export function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (value && typeof value === "object" && "toNumber" in value && typeof (value as { toNumber: () => number }).toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber();
  }

  return 0;
}

export function periodBounds(days: number) {
  const now = new Date();
  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - days);
  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - days);

  return { now, currentStart, previousStart };
}
