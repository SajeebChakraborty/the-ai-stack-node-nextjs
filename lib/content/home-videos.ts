/**
 * Embed-friendly AI YouTube promos for the static home page.
 * Official keynotes often block embedding — these IDs are known to work in iframes.
 */
/** Watch URL — parsed by buildYoutubeAutoplayEmbedUrl (do not use youtube-nocookie embed URLs). */
export function aiYoutubeWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export const HOME_AI_VIDEO_IDS = {
  /** 3Blue1Brown — But what is a GPT? (reliable embed) */
  hero: "kCc8FmEb1nY",
  courses: [
    "kCc8FmEb1nY",
    "aircAruvnKk",
    "R9OHn5ZF24U",
    "JMUxznvZ5Qw",
    "L_Guz73e6fw",
    "TlBMlNB6KhA"
  ],
  tools: {
    stackpilot: "TlBMlNB6KhA",
    promptforge: "kCc8FmEb1nY",
    clipnova: "LSX3qdyXqPg",
    contractlens: "aircAruvnKk"
  }
} as const;

export const HOME_AI_VIDEOS = {
  hero: aiYoutubeWatchUrl(HOME_AI_VIDEO_IDS.hero),
  courses: HOME_AI_VIDEO_IDS.courses.map(aiYoutubeWatchUrl),
  toolsBySlug: Object.fromEntries(
    Object.entries(HOME_AI_VIDEO_IDS.tools).map(([slug, id]) => [slug, aiYoutubeWatchUrl(id)])
  ) as Record<string, string>
};

/** Course index → source (for editors) */
export const HOME_COURSE_VIDEO_LABELS = [
  "But what is a GPT? (3Blue1Brown)",
  "Neural networks (3Blue1Brown)",
  "Neural networks deep dive (3Blue1Brown)",
  "Transformers explained (3Blue1Brown)",
  "Large language models (3Blue1Brown)",
  "But how do AI images work? (3Blue1Brown)"
] as const;
