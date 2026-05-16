import "server-only";

export function parseListInput(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export { normalizeYoutubeEmbedUrl } from "@/lib/utils/youtube-embed";
