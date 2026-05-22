"use client";

import { motion, useReducedMotion } from "framer-motion";
import { RankingsIcon, type RankingsIconId } from "@/components/rankings/rankings-icons";
import { LiveRankingList, type MetricKind } from "@/components/rankings/live-ranking-list";
import type { Tool } from "@/types/domain";
import { cn } from "@/lib/utils/cn";

export type RankingsBoardList = {
  title: string;
  subtitle: string;
  icon: RankingsIconId;
  metric: MetricKind;
  tools: Tool[];
  emptyMessage: string;
  /** Tailwind gradient utility for the card's top accent */
  accent: string;
  /** Tailwind color utility for the icon */
  iconColor: string;
  /** Ring color used on the icon chip */
  iconRing: string;
};

export function RankingsBoard({ lists }: { lists: RankingsBoardList[] }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="grid gap-5 lg:grid-cols-3"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
      }}
    >
      {lists.map((list) => {
        const total = list.tools.length;

        return (
          <motion.div
            key={list.title}
            variants={{
              hidden: { opacity: 0, y: 24, scale: 0.98 },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { type: "spring", stiffness: 280, damping: 30 }
              }
            }}
            whileHover={reduceMotion ? undefined : { y: -4 }}
            className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-shadow hover:shadow-xl"
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b",
                list.accent
              )}
            />
            <motion.div
              className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl"
              style={{ background: "currentColor" }}
              animate={
                reduceMotion
                  ? undefined
                  : { scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }
              }
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative flex items-start justify-between gap-3 border-b border-border/60 p-5">
              <div>
                <h2 className="font-display text-xl font-semibold leading-tight">{list.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{list.subtitle}</p>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="relative flex h-1.5 w-1.5">
                    <motion.span
                      className="absolute inline-flex h-full w-full rounded-full bg-emerald-500"
                      animate={
                        reduceMotion
                          ? undefined
                          : { scale: [1, 2.4, 1], opacity: [0.85, 0, 0.85] }
                      }
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                    />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Tracking {total} listing{total === 1 ? "" : "s"}
                </div>
              </div>
              <motion.span
                whileHover={reduceMotion ? undefined : { rotate: 6, scale: 1.08 }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary shadow-sm ring-1",
                  list.iconColor,
                  list.iconRing
                )}
              >
                <RankingsIcon id={list.icon} className="h-5 w-5" />
              </motion.span>
            </div>

            <div className="relative p-4">
              <LiveRankingList
                tools={list.tools}
                metric={list.metric}
                emptyMessage={list.emptyMessage}
              />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
