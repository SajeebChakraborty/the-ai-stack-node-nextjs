"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { easeSmooth, fadeScale, fadeUp, staggerItem } from "@/lib/motion/variants";

type RevealDirection = "up" | "down" | "left" | "right" | "scale";

function offsetForDirection(direction: Exclude<RevealDirection, "scale">) {
  switch (direction) {
    case "down":
      return { y: -28 };
    case "left":
      return { x: 36 };
    case "right":
      return { x: -36 };
    default:
      return { y: 32 };
  }
}

function variantsForDirection(direction: RevealDirection): Variants {
  if (direction === "scale") {
    return fadeScale;
  }
  if (direction === "up") {
    return fadeUp;
  }
  const offset = offsetForDirection(direction);
  return {
    hidden: { opacity: 0, ...offset },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.65, ease: easeSmooth }
    }
  };
}

const viewport = { once: true, amount: 0.18, margin: "-56px" } as const;

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = "up"
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: RevealDirection;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      transition={{ delay }}
      variants={variantsForDirection(direction)}
    >
      {children}
    </motion.div>
  );
}

export function StaggerReveal({
  children,
  className,
  delayChildren = 0.05
}: {
  children: ReactNode;
  className?: string;
  delayChildren?: number;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1, margin: "-48px" }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.11, delayChildren }
        }
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  direction = "up"
}: {
  eyebrow?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  align?: "left" | "center";
  direction?: RevealDirection;
}) {
  const centered = align === "center";

  return (
    <ScrollReveal
      direction={direction}
      className={
        centered
          ? "mx-auto max-w-2xl space-y-3 text-center"
          : "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      }
    >
      <div className={centered ? "space-y-3" : "max-w-2xl space-y-2"}>
        {eyebrow}
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
        {description ? <p className="text-muted-foreground sm:text-lg">{description}</p> : null}
      </div>
      {action && !centered ? <div className="shrink-0">{action}</div> : null}
      {action && centered ? <div className="flex justify-center pt-2">{action}</div> : null}
    </ScrollReveal>
  );
}
