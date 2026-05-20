"use client";

import { useMemo } from "react";
import { Play } from "lucide-react";
import { resolveToolPromoAutoplayEmbedUrl } from "@/lib/utils/youtube-embed";
import { cn } from "@/lib/utils/cn";

type ToolCardPromoVideoProps = {
  toolId: string;
  toolName: string;
  promoVideoUrl?: string | null;
  videos?: Array<{ embedUrl: string }>;
  className?: string;
};

export function ToolCardPromoVideo({
  toolId,
  toolName,
  promoVideoUrl,
  videos,
  className
}: ToolCardPromoVideoProps) {
  const embedUrl = useMemo(
    () => resolveToolPromoAutoplayEmbedUrl({ id: toolId, promoVideoUrl, videos }),
    [toolId, promoVideoUrl, videos]
  );

  if (!embedUrl) {
    return null;
  }

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-black", className)}>
      <iframe
        src={embedUrl}
        title={`${toolName} promo video`}
        className="pointer-events-none absolute inset-0 h-full w-full scale-[1.03] object-cover"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        loading="lazy"
        tabIndex={-1}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card/95 via-card/20 to-black/10" />
      <span className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
        <Play className="h-3 w-3 fill-current" />
        Preview
      </span>
    </div>
  );
}
