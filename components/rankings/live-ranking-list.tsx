"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion
} from "framer-motion";
import { ArrowDown, ArrowUp, Crown, Eye, Star, TrendingUp } from "lucide-react";
import type { Tool } from "@/types/domain";
import { Sparkline } from "@/components/rankings/sparkline";
import { ToolLogo } from "@/components/ui/tool-logo";
import { cn } from "@/lib/utils/cn";

export type MetricKind = "views-24h" | "rating" | "growth-30d";

type RankedItem = {
  tool: Tool;
  metric: number;
  previousMetric: number;
  /** Recent values used to draw the sparkline trail */
  history: number[];
  /** +1 climbed, -1 dropped, 0 unchanged — recomputed on every tick */
  delta: number;
};

const HISTORY_LENGTH = 14;

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function seedMetric(tool: Tool, metric: MetricKind, index: number): number {
  if (metric === "views-24h") {
    const base = tool.trendingScore * 180 + tool.reviewCount * 35 + 4_200;
    return Math.max(800, base - index * randomInt(180, 420));
  }
  if (metric === "rating") {
    return Number(tool.rating.toFixed(2));
  }
  return Math.max(2, tool.growthRate + randomInt(-4, 4));
}

function tickMetric(metric: MetricKind, current: number): number {
  if (metric === "views-24h") {
    const drift = Math.random() < 0.85 ? randomInt(8, 90) : -randomInt(2, 18);
    return Math.max(0, current + drift);
  }
  if (metric === "rating") {
    const drift = (Math.random() - 0.45) * 0.04;
    return Math.min(5, Math.max(3.6, Number((current + drift).toFixed(2))));
  }
  const drift = (Math.random() - 0.45) * randomInt(2, 12) * 0.1;
  return Math.max(0, Number((current + drift).toFixed(1)));
}

function formatMetric(metric: MetricKind, value: number) {
  if (metric === "views-24h") {
    return `${Math.round(value).toLocaleString()}`;
  }
  if (metric === "rating") {
    return value.toFixed(2);
  }
  return `+${value.toFixed(1)}%`;
}

function metricSuffix(metric: MetricKind) {
  if (metric === "views-24h") return "views";
  if (metric === "rating") return "★ rating";
  return "growth";
}

function rankItems(items: RankedItem[], metric: MetricKind) {
  return [...items].sort((a, b) => {
    if (metric === "rating") {
      return b.metric - a.metric || b.tool.reviewCount - a.tool.reviewCount;
    }
    return b.metric - a.metric;
  });
}

function metricColor(metric: MetricKind) {
  if (metric === "views-24h") return "hsl(var(--primary))";
  if (metric === "rating") return "rgb(245 158 11)";
  return "rgb(16 185 129)";
}

function MetricIcon({
  metric,
  className
}: {
  metric: MetricKind;
  className?: string;
}) {
  if (metric === "views-24h") return <Eye className={className} />;
  if (metric === "rating") return <Star className={cn("fill-current", className)} />;
  return <TrendingUp className={className} />;
}

export function LiveRankingList({
  tools,
  metric,
  emptyMessage
}: {
  tools: Tool[];
  metric: MetricKind;
  emptyMessage: string;
}) {
  const reduceMotion = useReducedMotion();

  const initial = useMemo<RankedItem[]>(() => {
    const seeded = tools.map((tool, index) => {
      const value = seedMetric(tool, metric, index);
      const history = Array.from({ length: HISTORY_LENGTH }, () =>
        tickMetric(metric, value)
      );
      history.push(value);
      return {
        tool,
        metric: value,
        previousMetric: value,
        history,
        delta: 0
      };
    });
    return rankItems(seeded, metric);
  }, [tools, metric]);

  const [items, setItems] = useState<RankedItem[]>(initial);

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    const schedule = () => {
      const delay =
        metric === "views-24h" ? randomInt(900, 2200) : randomInt(2000, 4200);

      intervalRef.current = setTimeout(() => {
        setItems((current) => {
          if (!current.length) return current;
          const mutationCount = randomInt(1, Math.min(3, current.length));
          const mutationIndexes = new Set<number>();
          while (mutationIndexes.size < mutationCount) {
            mutationIndexes.add(randomInt(0, current.length - 1));
          }

          const next = current.map((item, index) => {
            if (!mutationIndexes.has(index)) {
              return { ...item, delta: 0 };
            }
            const newValue = tickMetric(metric, item.metric);
            const nextHistory = [...item.history.slice(-HISTORY_LENGTH + 1), newValue];
            return {
              ...item,
              previousMetric: item.metric,
              metric: newValue,
              history: nextHistory,
              delta:
                newValue > item.metric ? 1 : newValue < item.metric ? -1 : 0
            };
          });

          return rankItems(next, metric);
        });
        schedule();
      }, delay);
    };

    schedule();
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [metric, reduceMotion]);

  if (!tools.length) {
    return (
      <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  const color = metricColor(metric);

  return (
    <LayoutGroup>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {items.map((item, index) => {
            const { tool, delta, history } = item;
            const isLeader = index === 0;
            const isPodium = index < 3;

            return (
              <motion.li
                key={tool.id}
                layout
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Link
                  href={`/tools/${tool.slug}`}
                  className={cn(
                    "group relative flex items-center gap-3 overflow-hidden rounded-xl border p-3 transition-all duration-300",
                    "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg",
                    isLeader
                      ? "border-primary/40 bg-gradient-to-r from-primary/[0.08] via-card to-card shadow-sm ring-1 ring-primary/20"
                      : isPodium
                        ? "border-border/80 bg-card/80"
                        : "border-border/60 bg-card/40"
                  )}
                >
                  {isLeader ? (
                    <motion.div
                      className="pointer-events-none absolute -inset-px rounded-xl"
                      style={{
                        background:
                          "linear-gradient(115deg, transparent 35%, hsl(var(--primary) / 0.3) 50%, transparent 65%)",
                        backgroundSize: "200% 100%"
                      }}
                      animate={
                        reduceMotion
                          ? undefined
                          : { backgroundPosition: ["-150% 0%", "150% 0%"] }
                      }
                      transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
                    />
                  ) : null}

                  <motion.span
                    layout
                    className={cn(
                      "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular-nums",
                      isLeader
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : isPodium
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-foreground"
                    )}
                  >
                    {isLeader ? (
                      <Crown className="h-4 w-4" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </motion.span>

                  <ToolLogo
                    src={tool.logoUrl}
                    alt={tool.name}
                    width={36}
                    height={36}
                    className="h-9 w-9 shrink-0 rounded-lg border border-border/60 object-cover"
                  />

                  <div className="relative min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-tight transition group-hover:text-primary">
                      {tool.name}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {tool.categories.length
                        ? tool.categories.slice(0, 2).join(" · ")
                        : "Uncategorized"}
                    </p>
                  </div>

                  <div className="hidden shrink-0 sm:block" style={{ color }}>
                    <Sparkline
                      values={history}
                      width={64}
                      height={22}
                      color={color}
                      fill={color}
                    />
                  </div>

                  <div className="relative flex shrink-0 flex-col items-end gap-1">
                    <motion.div
                      key={item.metric}
                      initial={
                        reduceMotion
                          ? false
                          : { opacity: 0.4, y: delta < 0 ? -4 : 4 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-center gap-1.5"
                    >
                      <MetricIcon
                        metric={metric}
                        className={cn(
                          "h-3.5 w-3.5",
                          metric === "rating" && "text-amber-500",
                          metric === "growth-30d" && "text-emerald-500",
                          metric === "views-24h" && "text-primary"
                        )}
                      />
                      <span className="text-sm font-semibold tabular-nums">
                        {formatMetric(metric, item.metric)}
                      </span>
                    </motion.div>
                    <span className="text-[10px] text-muted-foreground">
                      {metricSuffix(metric)}
                    </span>
                    <DeltaIndicator delta={delta} reduceMotion={reduceMotion} />
                  </div>
                </Link>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </LayoutGroup>
  );
}

function DeltaIndicator({
  delta,
  reduceMotion
}: {
  delta: number;
  reduceMotion: boolean | null;
}) {
  if (delta === 0) {
    return <span className="h-4 w-10" aria-hidden />;
  }

  const up = delta > 0;

  return (
    <motion.span
      initial={reduceMotion ? false : { opacity: 0, scale: 0.6, y: up ? 4 : -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 480, damping: 22 }}
      className={cn(
        "absolute -top-1 right-0 flex h-4 items-center gap-0.5 rounded-full px-1.5 text-[10px] font-semibold tabular-nums shadow-sm",
        up
          ? "bg-emerald-500 text-white"
          : "bg-rose-500 text-white"
      )}
    >
      {up ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
      {up ? "up" : "down"}
    </motion.span>
  );
}
