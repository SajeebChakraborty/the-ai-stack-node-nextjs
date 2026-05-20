"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

type LiveStatProps = {
  label: string;
  /** Minimum starting value (e.g. 95_000 → displays 95,000+). */
  seedMin: number;
  /** Random extra added once on mount so each visit differs slightly. */
  seedSpread?: number;
};

export function LiveStat({ label, seedMin, seedSpread = 12_000 }: LiveStatProps) {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(
    () => seedMin + randomInt(0, seedSpread)
  );

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleTick = () => {
      timeoutId = setTimeout(() => {
        setValue((current) => current + randomInt(1, 18));
        scheduleTick();
      }, randomInt(2_500, 7_500));
    };

    scheduleTick();
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <motion.li
      className="text-center sm:text-left"
      initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.55 }}
    >
      <motion.p
        key={value}
        className="text-xl font-bold tabular-nums text-primary sm:text-2xl"
        initial={reduceMotion ? false : { opacity: 0.6, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {value.toLocaleString()}+
      </motion.p>
      <p className="text-[10px] text-muted-foreground sm:text-xs">{label}</p>
    </motion.li>
  );
}
