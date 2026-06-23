import {
  DEFAULT_TOOL_LOGO,
  resolveToolLogoUrl as resolveToolLogoUrlFromDefaults
} from "@/lib/utils/tool-media-defaults";

export { DEFAULT_TOOL_LOGO };

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

export function resolveToolLogoUrl(raw?: string | null, seed?: string) {
  return resolveToolLogoUrlFromDefaults(raw, seed);
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
