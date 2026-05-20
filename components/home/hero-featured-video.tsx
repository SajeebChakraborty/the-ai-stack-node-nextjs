"use client";

import { useMemo } from "react";
import { HOME_AI_VIDEO_IDS } from "@/lib/content/home-videos";
import { buildYoutubeAutoplayEmbedUrl } from "@/lib/utils/youtube-embed";
import { cn } from "@/lib/utils/cn";

type HeroFeaturedVideoProps = {
  title: string;
  videoId?: string;
  className?: string;
};

/** Always-visible hero embed (same pattern as directory tool cards). */
export function HeroFeaturedVideo({
  title,
  videoId = HOME_AI_VIDEO_IDS.hero,
  className
}: HeroFeaturedVideoProps) {
  const embedUrl = useMemo(() => buildYoutubeAutoplayEmbedUrl(videoId), [videoId]);

  if (!embedUrl) {
    return (
      <div
        className={cn(
          "flex aspect-video w-full items-center justify-center rounded-2xl border border-white/10 bg-black/80 text-sm text-muted-foreground",
          className
        )}
      >
        Video preview unavailable
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl",
        className
      )}
    >
      <iframe
        src={embedUrl}
        title={title}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
