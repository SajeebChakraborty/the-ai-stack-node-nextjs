export const DEFAULT_TOOL_LOGO =
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=180&q=80";

const NEXT_IMAGE_REMOTE_HOSTS = new Set(["images.unsplash.com", "i.ytimg.com"]);

const IMAGE_EXTENSION_PATTERN = /\.(avif|gif|jpe?g|png|svg|webp)(\?|#|$)/i;

function hostnameAllowedForNextImage(hostname: string) {
  const host = hostname.toLowerCase();
  return NEXT_IMAGE_REMOTE_HOSTS.has(host) || host.endsWith(".supabase.co");
}

export function isYoutubeOrVideoUrl(value: string) {
  try {
    const host = new URL(value.trim()).hostname.toLowerCase();
    return host.includes("youtube.com") || host === "youtu.be" || host.includes("vimeo.com");
  } catch {
    return false;
  }
}

export function isLikelyImageUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (trimmed.startsWith("/")) {
    return true;
  }

  try {
    const url = new URL(trimmed);
    if (IMAGE_EXTENSION_PATTERN.test(url.pathname)) {
      return true;
    }

    return hostnameAllowedForNextImage(url.hostname);
  } catch {
    return false;
  }
}

export function resolveToolLogoUrl(raw?: string | null) {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return DEFAULT_TOOL_LOGO;
  }

  if (isYoutubeOrVideoUrl(trimmed)) {
    return DEFAULT_TOOL_LOGO;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return DEFAULT_TOOL_LOGO;
    }

    if (!isLikelyImageUrl(trimmed)) {
      return DEFAULT_TOOL_LOGO;
    }

    return trimmed;
  } catch {
    return DEFAULT_TOOL_LOGO;
  }
}

export function filterLikelyImageUrls(urls: string[]) {
  return urls.map((url) => url.trim()).filter((url) => isLikelyImageUrl(url));
}

export function canUseNextImage(src: string) {
  if (src.startsWith("/")) {
    return true;
  }

  try {
    return hostnameAllowedForNextImage(new URL(src).hostname);
  } catch {
    return false;
  }
}
