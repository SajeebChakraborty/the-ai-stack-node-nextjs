"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Star, TrendingUp } from "lucide-react";
import { cardHover } from "@/lib/motion/variants";
import type { DirectoryTool } from "@/types/directory";
import { PromoVideo } from "@/components/home/promo-video";
import { ToolLogo } from "@/components/ui/tool-logo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

export function ToolSpotlightCard({
  tool,
  rank,
  large = false,
  className
}: {
  tool: DirectoryTool;
  rank?: number;
  large?: boolean;
  className?: string;
}) {
  const hasVideo = Boolean(tool.promoVideoUrl || tool.videos?.[0]?.embedUrl);
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn("h-full", className)}
      whileHover={reduceMotion ? undefined : cardHover}
    >
    <Link
      href={`/tools/${tool.slug}`}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-[border-color,box-shadow] hover:border-primary/35 hover:shadow-glow",
        large && "md:col-span-2 md:row-span-2"
      )}
    >
      <div className={cn("relative bg-secondary/50", large ? "aspect-[16/11]" : "aspect-[16/10]")}>
        {hasVideo ? (
          <PromoVideo
            videoUrl={tool.promoVideoUrl ?? tool.videos[0]?.embedUrl}
            posterUrl={tool.screenshots[0] ?? tool.logoUrl}
            title={tool.name}
            className="h-full rounded-none border-0 shadow-none"
            aspectClassName="h-full min-h-full"
            showPlayOverlay
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
            <ToolLogo src={tool.logoUrl} alt={tool.name} width={large ? 72 : 56} height={large ? 72 : 56} className="rounded-xl" />
            {tool.screenshots[0] ? (
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `url(${tool.screenshots[0]})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              />
            ) : null}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        {rank != null ? (
          <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            {rank}
          </span>
        ) : null}
        {tool.verified ? (
          <Badge variant="verified" className="absolute right-3 top-3">
            Verified
          </Badge>
        ) : null}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-2">
            <ToolLogo src={tool.logoUrl} alt={tool.name} width={36} height={36} className="rounded-lg ring-2 ring-background" />
            <div className="min-w-0">
              <h3 className={cn("truncate font-semibold text-white", large && "text-xl")}>{tool.name}</h3>
              <p className="truncate text-xs text-white/75">{tool.tagline}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border/50 px-4 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1 text-amber-500">
          <Star className="h-3.5 w-3.5 fill-current" />
          {tool.rating.toFixed(1)}
        </span>
        <span className="flex items-center gap-1 text-emerald-500">
          <TrendingUp className="h-3.5 w-3.5" />
          +{Math.round(tool.growthRate)}%
        </span>
        <span className="flex items-center gap-1 font-medium text-foreground group-hover:text-primary">
          View
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
    </motion.div>
  );
}
