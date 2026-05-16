"use client";

import { motion } from "framer-motion";

const orbs = [
  { className: "left-[8%] top-[12%] h-72 w-72", delay: 0 },
  { className: "right-[10%] top-[20%] h-96 w-96", delay: 0.4 },
  { className: "bottom-[8%] left-[35%] h-80 w-80", delay: 0.8 }
] as const;

export function HeroBackground() {
  return (
    <motion.div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.22),transparent_40%),linear-gradient(to_bottom,transparent,hsl(var(--background)))]" />
      <motion.div className="absolute inset-0 bg-grid subtle-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />
      {orbs.map((orb) => (
        <motion.div
          key={orb.className}
          className={`absolute rounded-full bg-primary/20 blur-3xl ${orb.className}`}
          animate={{
            y: [0, -28, 0],
            x: [0, 18, 0],
            scale: [1, 1.08, 1],
            opacity: [0.35, 0.55, 0.35]
          }}
          transition={{
            duration: 9 + orb.delay * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay
          }}
        />
      ))}
      {Array.from({ length: 24 }).map((_, index) => (
        <motion.span
          key={index}
          className="absolute h-1 w-1 rounded-full bg-primary/60"
          style={{
            left: `${(index * 17) % 100}%`,
            top: `${(index * 23) % 100}%`
          }}
          animate={{
            y: [0, -40 - (index % 5) * 8, 0],
            opacity: [0.15, 0.7, 0.15]
          }}
          transition={{
            duration: 4 + (index % 6),
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.15
          }}
        />
      ))}
    </motion.div>
  );
}
