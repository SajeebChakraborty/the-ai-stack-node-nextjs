"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { heroItem, heroStagger } from "@/lib/motion/variants";
import { cn } from "@/lib/utils/cn";

type ImmersivePageHeroProps = {
  eyebrow: string;
  title: string;
  accent?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  align?: "left" | "center";
};

export function ImmersivePageHero({
  eyebrow,
  title,
  accent,
  description,
  children,
  className,
  align = "left"
}: ImmersivePageHeroProps) {
  const reduceMotion = useReducedMotion();
  const centered = align === "center";

  return (
    <section
      className={cn(
        "relative isolate mb-10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-10 sm:px-10 sm:py-14",
        className
      )}
    >
      {/* Animated background layers */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="landing-grid absolute inset-0 animate-grid-pan opacity-60" />
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-[120px] animate-aurora" />
        <div
          className="absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-violet-500/20 blur-[130px] animate-aurora"
          style={{ animationDelay: "-6s" }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </div>

      <motion.div
        className={cn("relative max-w-3xl", centered && "mx-auto text-center")}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={heroStagger}
      >
        <motion.div
          variants={heroItem}
          className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary backdrop-blur"
        >
          <span className="relative flex h-2 w-2">
            <motion.span
              className="absolute inline-flex h-full w-full rounded-full bg-primary"
              animate={reduceMotion ? undefined : { scale: [1, 2.4, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          {eyebrow}
        </motion.div>

        <motion.h1
          variants={heroItem}
          className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-5xl"
        >
          {title}
          {accent ? (
            <>
              {" "}
              <span className="bg-gradient-to-r from-primary via-rose-400 to-amber-400 bg-clip-text text-transparent">
                {accent}
              </span>
            </>
          ) : null}
        </motion.h1>

        {description ? (
          <motion.p
            variants={heroItem}
            className={cn(
              "mt-4 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg",
              centered && "mx-auto"
            )}
          >
            {description}
          </motion.p>
        ) : null}

        {children ? (
          <motion.div variants={heroItem} className="mt-6">
            {children}
          </motion.div>
        ) : null}
      </motion.div>
    </section>
  );
}
