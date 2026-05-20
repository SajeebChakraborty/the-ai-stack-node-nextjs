import type { Transition, Variants } from "framer-motion";

export const easeSmooth = [0.22, 1, 0.36, 1] as const;

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 340,
  damping: 28
};

export const springSoft: Transition = {
  type: "spring",
  stiffness: 220,
  damping: 26
};

export const heroStagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.06 }
  }
};

export const heroItem: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeSmooth }
  }
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeSmooth }
  }
};

export const fadeIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, ease: easeSmooth }
  }
};

export const fadeScale: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springSnappy
  }
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.04 }
  }
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springSnappy
  }
};

export const cardHover = {
  y: -8,
  scale: 1.015,
  transition: springSnappy
};

export const cardTap = { scale: 0.99, transition: { duration: 0.15 } };
