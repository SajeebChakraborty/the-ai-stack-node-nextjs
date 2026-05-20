"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { HOME_AI_VIDEO_IDS } from "@/lib/content/home-videos";
import { buildYoutubeAutoplayEmbedUrl } from "@/lib/utils/youtube-embed";
import { fadeScale } from "@/lib/motion/variants";
import { cn } from "@/lib/utils/cn";

type HeroFeaturedVideoProps = {
  title: string;
  videoId?: string;
  className?: string;
};

export function HeroFeaturedVideo({
  title,
  videoId = HOME_AI_VIDEO_IDS.hero,
  className
}: HeroFeaturedVideoProps) {
  const reduceMotion = useReducedMotion();
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
    <motion.div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl",
        className
      )}
      variants={fadeScale}
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
    >
      {!reduceMotion ? (
        <motion.div
          className="pointer-events-none absolute -inset-px z-10 rounded-2xl ring-1 ring-primary/30"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}
      <iframe
        src={embedUrl}
        title={title}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </motion.div>
  );
}
