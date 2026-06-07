"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function ValuePropCard({
  title,
  description,
  icon: Icon,
  index = 0
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  index?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="glow-card glow-card-hover group h-full overflow-hidden p-6 sm:p-8"
      whileHover={reduceMotion ? undefined : { y: -8 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
    >
      {/* hover aura */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-primary shadow-[0_0_24px_-6px_hsl(var(--primary)/0.7)] transition-transform duration-300 group-hover:scale-110">
          {Icon ? <Icon className="h-6 w-6" /> : null}
        </div>
        <span className="font-display text-4xl font-bold text-white/10 transition-colors duration-300 group-hover:text-primary/30">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <motion.div
        className="relative mt-5 h-1 w-10 rounded-full bg-primary/80"
        initial={reduceMotion ? false : { scaleX: 0, originX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.15 }}
      />
      <h3 className={cn("mt-4 font-display text-lg font-semibold sm:text-xl")}>{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/60 sm:text-base">{description}</p>
    </motion.div>
  );
}
