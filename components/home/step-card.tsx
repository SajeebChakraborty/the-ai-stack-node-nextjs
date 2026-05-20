"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cardHover } from "@/lib/motion/variants";

export function StepCard({
  step,
  title,
  text
}: {
  step: string;
  title: string;
  text: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="relative rounded-2xl border border-transparent p-4 transition-colors hover:border-border/60 hover:bg-muted/30 md:pl-0 md:pt-14 md:text-center"
      whileHover={reduceMotion ? undefined : { ...cardHover, scale: 1.02 }}
    >
      <motion.span
        className="absolute left-4 top-4 font-display text-4xl font-bold text-primary/30 md:left-1/2 md:top-0 md:-translate-x-1/2 md:text-5xl"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
      >
        {step}
      </motion.span>
      <h3 className="pl-12 font-semibold md:mt-2 md:pl-0">{title}</h3>
      <p className="mt-2 pl-12 text-sm text-muted-foreground md:pl-0">{text}</p>
    </motion.div>
  );
}
