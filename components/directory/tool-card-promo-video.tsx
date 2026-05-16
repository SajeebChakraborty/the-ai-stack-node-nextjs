"use client";

import { useMemo } from "react";
import { resolveToolPromoAutoplayEmbedUrl } from "@/lib/utils/youtube-embed";

type ToolCardPromoVideoProps = {
  toolId: string;
  toolName: string;
  promoVideoUrl?: string | null;
  videos?: Array<{ embedUrl: string }>;
};

export function ToolCardPromoVideo({ toolId, toolName, promoVideoUrl, videos }: ToolCardPromoVideoProps) {
  const embedUrl = useMemo(
    () => resolveToolPromoAutoplayEmbedUrl({ id: toolId, promoVideoUrl, videos }),
    [toolId, promoVideoUrl, videos]
  );

  if (!embedUrl) {
    return null;
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden border-b bg-black">
      <iframe
        src={embedUrl}
        title={`${toolName} promo video`}
        className="pointer-events-none absolute inset-0 h-full w-full scale-[1.02] object-cover"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        loading="lazy"
        tabIndex={-1}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />
    </div>
  );
}
