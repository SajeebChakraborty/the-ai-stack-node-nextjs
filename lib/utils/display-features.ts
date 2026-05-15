function looksLikeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("www.")) {
    return true;
  }

  try {
    const url = new URL(trimmed.startsWith("//") ? `https:${trimmed}` : trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function filterDisplayFeatures(features: string[]) {
  const seen = new Set<string>();

  return features
    .map((feature) => feature.trim())
    .filter((feature) => {
      if (!feature || looksLikeUrl(feature) || feature.length > 180) {
        return false;
      }

      const key = feature.toLowerCase();
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}
