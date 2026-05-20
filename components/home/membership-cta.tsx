"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fadeUp, staggerContainer } from "@/lib/motion/variants";

export function MembershipCta() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className="overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/15 via-background to-violet-950/20 p-8 sm:p-12">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="premium" className="mb-4">
            Membership
          </Badge>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Unlock every course on TheAiStack</h2>
          <p className="mt-4 text-muted-foreground sm:text-lg">
            Enroll in multiple courses, download certificates, and get full directory access with one plan.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/pricing">View plans</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/rankings">See rankings</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/15 via-background to-violet-950/20 p-8 sm:p-12"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.35 }}
      variants={staggerContainer}
      whileHover={{ boxShadow: "0 0 40px hsl(var(--primary) / 0.15)" }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_60%)]"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative mx-auto max-w-2xl text-center">
        <motion.div variants={fadeUp}>
          <Badge variant="premium" className="mb-4">
            Membership
          </Badge>
        </motion.div>
        <motion.h2 variants={fadeUp} className="font-display text-3xl font-bold sm:text-4xl">
          Unlock every course on TheAiStack
        </motion.h2>
        <motion.p variants={fadeUp} className="mt-4 text-muted-foreground sm:text-lg">
          Enroll in multiple courses, download certificates, and get full directory access with one plan.
        </motion.p>
        <motion.div variants={fadeUp} className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
            <Button asChild size="lg">
              <Link href="/pricing">View plans</Link>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
            <Button asChild size="lg" variant="outline">
              <Link href="/rankings">See rankings</Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
