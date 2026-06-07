"use client";

import { motion, useReducedMotion } from "framer-motion";

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
      className="glow-card glow-card-hover group relative h-full overflow-hidden p-6 sm:p-7"
      whileHover={reduceMotion ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <motion.span
        className="font-display text-5xl font-bold text-glow text-primary/40"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
      >
        {step}
      </motion.span>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/60">{text}</p>
    </motion.div>
  );
}
