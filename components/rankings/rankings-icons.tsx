"use client";

import { Flame, Sparkles, Star, type LucideIcon } from "lucide-react";

export type RankingsIconId = "flame" | "star" | "sparkles";

const iconMap: Record<RankingsIconId, LucideIcon> = {
  flame: Flame,
  star: Star,
  sparkles: Sparkles
};

export function RankingsIcon({
  id,
  className
}: {
  id: RankingsIconId;
  className?: string;
}) {
  const Icon = iconMap[id];
  return <Icon className={className} />;
}
