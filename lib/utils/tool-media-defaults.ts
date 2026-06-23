import { HOME_AI_VIDEO_IDS, aiYoutubeWatchUrl } from "@/lib/content/home-videos";
import { platformPillarImages } from "@/lib/content/home-images";
import { buildYoutubeAutoplayEmbedUrl, pickFallbackYoutubeVideoId } from "@/lib/utils/youtube-embed";

/** Default logo when a listing has no valid image URL. */
export const DEFAULT_TOOL_LOGO =
  "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=180&q=80";

const IMAGE_EXTENSION_PATTERN = /\.(avif|gif|jpe?g|png|svg|webp)(\?|#|$)/i;
const NEXT_IMAGE_REMOTE_HOSTS = new Set(["images.unsplash.com", "i.ytimg.com"]);

function isYoutubeOrVideoUrl(value: string) {
  try {
    const host = new URL(value.trim()).hostname.toLowerCase();
    return host.includes("youtube.com") || host === "youtu.be" || host.includes("vimeo.com");
  } catch {
    return false;
  }
}

function isLikelyImageUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("/")) {
    return Boolean(trimmed);
  }

  try {
    const url = new URL(trimmed);
    if (IMAGE_EXTENSION_PATTERN.test(url.pathname)) {
      return true;
    }
    const host = url.hostname.toLowerCase();
    return NEXT_IMAGE_REMOTE_HOSTS.has(host) || host.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

function filterLikelyImageUrls(urls: string[]) {
  return urls.map((url) => url.trim()).filter((url) => isLikelyImageUrl(url));
}

/** AI-themed cover images for directory cards without uploads. */
export const AI_TOOL_COVER_IMAGES = [
  platformPillarImages.directory,
  platformPillarImages.courses,
  platformPillarImages.rankings,
  platformPillarImages.automations,
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1517694712202-14dd65398388?auto=format&fit=crop&w=1400&q=90"
] as const;

const EMBEDDABLE_AI_VIDEO_IDS = [
  HOME_AI_VIDEO_IDS.hero,
  ...HOME_AI_VIDEO_IDS.courses,
  ...Object.values(HOME_AI_VIDEO_IDS.tools)
] as const;

function hashSeed(seed: string, modulo: number) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash + seed.charCodeAt(index)) % modulo;
  }
  return hash;
}

export function pickToolCoverImage(seed: string) {
  return AI_TOOL_COVER_IMAGES[hashSeed(seed, AI_TOOL_COVER_IMAGES.length)] ?? AI_TOOL_COVER_IMAGES[0];
}

export function pickToolLogoImage(seed: string) {
  return pickToolCoverImage(`${seed}-logo`);
}

function isEmbeddableYoutubeUrl(value: string) {
  return Boolean(buildYoutubeAutoplayEmbedUrl(value));
}

export function resolveDirectoryPromoVideoUrl(input: {
  id: string;
  slug: string;
  promoVideoUrl?: string | null;
  seedPromoVideoUrl?: string | null;
  seedVideos?: Array<{ embedUrl: string }>;
}) {
  const slugVideo = HOME_AI_VIDEO_IDS.tools[input.slug as keyof typeof HOME_AI_VIDEO_IDS.tools];
  const candidates = [
    input.promoVideoUrl,
    input.seedPromoVideoUrl,
    input.seedVideos?.[0]?.embedUrl,
    slugVideo ? aiYoutubeWatchUrl(slugVideo) : null
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  for (const candidate of candidates) {
    if (isEmbeddableYoutubeUrl(candidate)) {
      return candidate.trim();
    }
  }

  const fallbackId =
    slugVideo ??
    pickFallbackYoutubeVideoId(input.id) ??
    EMBEDDABLE_AI_VIDEO_IDS[hashSeed(input.slug || input.id, EMBEDDABLE_AI_VIDEO_IDS.length)];

  return aiYoutubeWatchUrl(fallbackId);
}

export function resolveToolScreenshots(input: {
  id: string;
  slug: string;
  metadata?: Record<string, unknown> | null;
  seedScreenshots?: string[];
}) {
  const metadataUrls = Array.isArray(input.metadata?.screenshots)
    ? input.metadata!.screenshots.filter((item): item is string => typeof item === "string")
    : [];

  const cleaned = filterLikelyImageUrls([
    ...metadataUrls,
    ...(input.seedScreenshots ?? [])
  ]);

  if (cleaned.length > 0) {
    return cleaned;
  }

  return [pickToolCoverImage(input.slug || input.id)];
}

export function resolveToolLogoUrl(raw: string | null | undefined, seed?: string) {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return seed ? pickToolLogoImage(seed) : DEFAULT_TOOL_LOGO;
  }

  if (isYoutubeOrVideoUrl(trimmed)) {
    return seed ? pickToolLogoImage(seed) : DEFAULT_TOOL_LOGO;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return seed ? pickToolLogoImage(seed) : DEFAULT_TOOL_LOGO;
    }

    const cleaned = filterLikelyImageUrls([trimmed]);
    if (cleaned.length === 0) {
      return seed ? pickToolLogoImage(seed) : DEFAULT_TOOL_LOGO;
    }

    return cleaned[0]!;
  } catch {
    return seed ? pickToolLogoImage(seed) : DEFAULT_TOOL_LOGO;
  }
}
