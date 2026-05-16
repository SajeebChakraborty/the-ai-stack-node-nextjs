"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

export function GradientText({ children, className }: { children: string; className?: string }) {
  return (
    <motion.span
      className={cn(
        "bg-gradient-to-r from-foreground via-primary to-foreground bg-[length:200%_auto] bg-clip-text text-transparent",
        className
      )}
      animate={{ backgroundPosition: ["0% center", "200% center", "0% center"] }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
    >
      {children}
    </motion.span>
  );
}
