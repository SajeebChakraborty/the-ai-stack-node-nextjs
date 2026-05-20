export type LessonVideoPlayer =
  | { kind: "iframe"; src: string }
  | { kind: "video"; src: string }
  | null;

export function getLessonVideoPlayer(url: string | null | undefined): LessonVideoPlayer {
  if (!url?.trim()) {
    return null;
  }

  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);

    if (/\.(mp4|webm|ogg)(\?|$)/i.test(parsed.pathname)) {
      return { kind: "video", src: trimmed };
    }

    const isYoutube =
      parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtube-nocookie.com");

    if (isYoutube) {
      if (parsed.pathname.startsWith("/embed/")) {
        const id = parsed.pathname.replace("/embed/", "").split("/")[0];
        return {
          kind: "iframe",
          src: id ? `https://www.youtube.com/embed/${id}` : trimmed
        };
      }
      const id = parsed.searchParams.get("v");
      if (id) {
        return { kind: "iframe", src: `https://www.youtube.com/embed/${id}?autoplay=1` };
      }
    }

    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.replace("/", "");
      if (id) {
        return { kind: "iframe", src: `https://www.youtube.com/embed/${id}?autoplay=1` };
      }
    }

    if (parsed.hostname.includes("vimeo.com")) {
      const match = parsed.pathname.match(/\/(\d+)/);
      if (match?.[1]) {
        return { kind: "iframe", src: `https://player.vimeo.com/video/${match[1]}?autoplay=1` };
      }
    }
  } catch {
    if (/\.(mp4|webm|ogg)(\?|$)/i.test(trimmed)) {
      return { kind: "video", src: trimmed };
    }
  }

  return { kind: "iframe", src: trimmed };
}

export function getYoutubeEmbed(url: string | null) {
  const player = getLessonVideoPlayer(url);
  if (player?.kind === "iframe") {
    return player.src.replace("?autoplay=1", "");
  }
  return null;
}
