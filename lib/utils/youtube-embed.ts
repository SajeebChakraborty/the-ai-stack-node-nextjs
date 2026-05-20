const FALLBACK_YOUTUBE_VIDEO_IDS = [
  "aircAruvnKk",
  "kCc8FmEb1nY",
  "R9OHn5ZF24U",
  "JMUxznvZ5Qw",
  "L_Guz73e6fw",
  "TlBMlNB6KhA"
] as const;

function isYoutubeHost(host: string) {
  return host.includes("youtube.com") || host.includes("youtube-nocookie.com");
}

export function normalizeYoutubeEmbedUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();

    if (isYoutubeHost(host)) {
      if (url.pathname.startsWith("/embed/")) {
        const id = url.pathname.replace("/embed/", "").split("/")[0];
        return id ? `https://www.youtube.com/embed/${id}` : trimmed;
      }

      const videoId = url.searchParams.get("v");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    if (host === "youtu.be") {
      const videoId = url.pathname.replace(/\//g, "");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

export function extractYoutubeVideoId(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(normalizeYoutubeEmbedUrl(trimmed));
    const host = url.hostname.toLowerCase();

    if (isYoutubeHost(host) && url.pathname.startsWith("/embed/")) {
      return url.pathname.replace("/embed/", "").split("/")[0] || null;
    }

    if (host === "youtu.be") {
      return url.pathname.replace(/\//g, "") || null;
    }

    const watchId = url.searchParams.get("v");
    if (watchId) {
      return watchId;
    }
  } catch {
    return null;
  }

  return null;
}

export function buildYoutubeAutoplayEmbedUrl(videoIdOrUrl: string) {
  const trimmed = videoIdOrUrl.trim();
  const videoId =
    extractYoutubeVideoId(trimmed) ??
    (/^[a-zA-Z0-9_-]{11}$/.test(trimmed) ? trimmed : null);
  if (!videoId) {
    return null;
  }

  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    playsinline: "1",
    controls: "0",
    rel: "0",
    loop: "1",
    playlist: videoId,
    modestbranding: "1",
    iv_load_policy: "3"
  });

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

export function pickFallbackYoutubeVideoId(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash + seed.charCodeAt(index)) % FALLBACK_YOUTUBE_VIDEO_IDS.length;
  }

  return FALLBACK_YOUTUBE_VIDEO_IDS[hash] ?? FALLBACK_YOUTUBE_VIDEO_IDS[0];
}

export function resolveToolPromoAutoplayEmbedUrl(tool: {
  id: string;
  promoVideoUrl?: string | null;
  videos?: Array<{ embedUrl: string }>;
}) {
  const candidates = [tool.promoVideoUrl, tool.videos?.[0]?.embedUrl].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0
  );

  for (const candidate of candidates) {
    const normalized = normalizeYoutubeEmbedUrl(candidate);
    const autoplay = buildYoutubeAutoplayEmbedUrl(normalized);
    if (autoplay) {
      return autoplay;
    }
  }

  return buildYoutubeAutoplayEmbedUrl(pickFallbackYoutubeVideoId(tool.id));
}
