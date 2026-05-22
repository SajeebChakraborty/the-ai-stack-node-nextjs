"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Activity, Radio } from "lucide-react";

const chips = [
  { label: "Live views", color: "from-primary/20 to-primary/5" },
  { label: "Buyer rating", color: "from-amber-500/20 to-amber-500/5" },
  { label: "Growth %", color: "from-emerald-500/20 to-emerald-500/5" },
  { label: "Trust score", color: "from-violet-500/20 to-violet-500/5" },
  { label: "Reviews", color: "from-rose-500/20 to-rose-500/5" }
];

export function RankingsHero() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative mb-10 overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-primary/[0.08] via-card to-card p-8 sm:p-10">
      <motion.div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
        animate={reduceMotion ? undefined : { scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"
        animate={reduceMotion ? undefined : { scale: [1, 1.1, 1], opacity: [0.3, 0.55, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="relative max-w-3xl">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary backdrop-blur"
        >
          <span className="relative flex h-2 w-2">
            <motion.span
              className="absolute inline-flex h-full w-full rounded-full bg-primary"
              animate={reduceMotion ? undefined : { scale: [1, 2.4, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <Radio className="h-3 w-3" />
          Live ranking engine
        </motion.div>

        <motion.h1
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl"
        >
          Rankings that reward{" "}
          <span className="bg-gradient-to-r from-primary via-rose-500 to-amber-500 bg-clip-text text-transparent">
            trust, proof,
          </span>{" "}
          and momentum.
        </motion.h1>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg"
        >
          Live rankings refreshed every few seconds from real signals — views, reviews,
          trust score, and growth velocity. Watch positions shift in real time.
        </motion.p>

        <motion.div
          className="mt-6 flex flex-wrap gap-2"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } }
          }}
        >
          {chips.map((chip) => (
            <motion.span
              key={chip.label}
              variants={{
                hidden: { opacity: 0, y: 8, scale: 0.9 },
                visible: { opacity: 1, y: 0, scale: 1 }
              }}
              whileHover={reduceMotion ? undefined : { y: -2, scale: 1.05 }}
              className={`inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-gradient-to-br ${chip.color} px-3 py-1 text-xs font-medium`}
            >
              <Activity className="h-3 w-3" />
              {chip.label}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
