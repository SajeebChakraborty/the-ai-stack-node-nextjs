export function formatDurationLabel(totalSeconds: number) {
  if (totalSeconds <= 0) {
    return "—";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes} min`;
}

export function formatDurationMinutes(totalMinutes: number) {
  if (totalMinutes <= 0) {
    return "—";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours} Hour${hours === 1 ? "" : "s"}${minutes ? ` ${minutes} min` : ""}`;
  }

  return `${minutes} min`;
}

export function slugifyCourse(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function parseStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function toMonthYearLabel(value: Date | null | undefined) {
  if (!value) {
    return null;
  }

  return value.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
