"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Quote } from "lucide-react";
import { cardHover } from "@/lib/motion/variants";

export function ReviewQuoteCard({
  title,
  body,
  authorName,
  toolName,
  toolSlug
}: {
  title: string;
  body: string;
  authorName: string;
  toolName: string;
  toolSlug: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.blockquote
      className="relative h-full rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm"
      whileHover={reduceMotion ? undefined : cardHover}
    >
      <motion.div
        initial={reduceMotion ? false : { rotate: -12, opacity: 0 }}
        whileInView={{ rotate: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <Quote className="mb-3 h-8 w-8 text-primary/40" />
      </motion.div>
      <p className="font-medium leading-snug">&ldquo;{title}&rdquo;</p>
      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{body}</p>
      <footer className="mt-4 text-xs text-muted-foreground">
        {authorName} ·{" "}
        <Link href={`/tools/${toolSlug}`} className="text-primary hover:underline">
          {toolName}
        </Link>
      </footer>
    </motion.blockquote>
  );
}
