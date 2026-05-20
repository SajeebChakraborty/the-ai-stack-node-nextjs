"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { easeSmooth, fadeUp, staggerContainer, staggerItem } from "@/lib/motion/variants";

type RevealDirection = "up" | "down" | "left" | "right";

function offsetForDirection(direction: RevealDirection) {
  switch (direction) {
    case "down":
      return { y: -28 };
    case "left":
      return { x: 32 };
    case "right":
      return { x: -32 };
    default:
      return { y: 32 };
  }
}

function variantsForDirection(direction: RevealDirection): Variants {
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

const viewport = { once: true, amount: 0.2, margin: "-48px" } as const;

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

  const variants = direction === "up" ? fadeUp : variantsForDirection(direction);

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      transition={{ delay }}
      variants={variants}
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
      viewport={{ once: true, amount: 0.12, margin: "-40px" }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.1, delayChildren }
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

/** Re-export for consumers that need the raw container variants */
export { staggerContainer, staggerItem };
