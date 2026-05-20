"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Play } from "lucide-react";
import { buildYoutubeAutoplayEmbedUrl } from "@/lib/utils/youtube-embed";
import { fadeScale } from "@/lib/motion/variants";
import { cn } from "@/lib/utils/cn";
import { RemoteImage } from "@/components/ui/remote-image";

type PromoVideoProps = {
  videoUrl: string | null | undefined;
  posterUrl?: string | null;
  title: string;
  className?: string;
  aspectClassName?: string;
  autoplay?: boolean;
  showPlayOverlay?: boolean;
};

export function PromoVideo({
  videoUrl,
  posterUrl,
  title,
  className,
  aspectClassName = "aspect-video",
  autoplay = false,
  showPlayOverlay = true
}: PromoVideoProps) {
  const reduceMotion = useReducedMotion();
  const embedUrl = useMemo(
    () => (videoUrl?.trim() ? buildYoutubeAutoplayEmbedUrl(videoUrl) : null),
    [videoUrl]
  );
  const [playing, setPlaying] = useState(autoplay);

  if (!embedUrl && !posterUrl) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary",
          aspectClassName,
          className
        )}
      >
        <Play className="h-12 w-12 text-primary/60" />
      </div>
    );
  }

  if (playing && embedUrl) {
    return (
      <motion.div
        className={cn(
          "relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl",
          aspectClassName,
          className
        )}
        variants={fadeScale}
        initial="hidden"
        animate="visible"
      >
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

  return (
    <button
      type="button"
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black text-left shadow-2xl",
        aspectClassName,
        className
      )}
      onClick={() => embedUrl && setPlaying(true)}
      aria-label={`Play ${title}`}
    >
      {posterUrl ? (
        <RemoteImage
          src={posterUrl}
          alt={title}
          width={1280}
          height={720}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-primary/30 via-background to-violet-900/40" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      {showPlayOverlay && embedUrl ? (
        <motion.span
          className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow sm:h-16 sm:w-16"
          whileHover={reduceMotion ? undefined : { scale: 1.12 }}
          animate={reduceMotion ? undefined : { scale: [1, 1.06, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Play className="ml-1 h-6 w-6 fill-current sm:h-7 sm:w-7" />
        </motion.span>
      ) : null}
    </button>
  );
}
