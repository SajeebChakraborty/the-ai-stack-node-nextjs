"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cardHover } from "@/lib/motion/variants";
import { cn } from "@/lib/utils/cn";

export function ValuePropCard({
  title,
  description,
  accent
}: {
  title: string;
  description: string;
  accent: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(
        "h-full rounded-2xl border border-border/50 bg-gradient-to-br p-6 transition-shadow duration-300 hover:shadow-glow sm:p-8",
        accent
      )}
      whileHover={reduceMotion ? undefined : cardHover}
    >
      <motion.div
        className="mb-3 h-1 w-10 rounded-full bg-primary/80"
        initial={reduceMotion ? false : { scaleX: 0, originX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.15 }}
      />
      <h3 className="font-display text-lg font-semibold sm:text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>
    </motion.div>
  );
}
