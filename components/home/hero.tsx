"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Hero3DShowcase } from "@/components/home/hero-3d-showcase";
import { HeroBackground } from "@/components/home/hero-background";
import { GradientText } from "@/components/home/gradient-text";
import { HeroSearch } from "@/components/home/hero-search";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "18K+", label: "verified reviews" },
  { value: "4.8M", label: "monthly buyer signals" },
  { value: "$2.1M", label: "creator payouts tracked" }
] as const;

const heroStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.08 }
  }
};

const heroItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }
};

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <HeroBackground />
      <div className="container relative grid min-h-[760px] items-center gap-12 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <motion.div className="space-y-8" variants={heroStagger} initial="hidden" animate="visible">
          <motion.div variants={heroItem}>
            <motion.div
              className="inline-flex items-center rounded-full border border-primary/25 bg-background/60 px-4 py-1.5 text-sm text-muted-foreground shadow-glow backdrop-blur-md"
              whileHover={{ scale: 1.03 }}
            >
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              AI discovery, trust, media, and growth intelligence
            </motion.div>
          </motion.div>

          <motion.div className="space-y-5" variants={heroItem}>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
              The AI stack buyers <GradientText>trust</GradientText> before they buy.
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
              Discover verified tools, ranked reviews, creator-led videos, founder analytics, launch campaigns, and
              buyer-grade proof in one premium AI ecosystem.
            </p>
          </motion.div>

          <motion.div variants={heroItem}>
            <HeroSearch />
          </motion.div>

          <motion.div className="flex flex-wrap gap-3" variants={heroItem}>
            <Button asChild size="lg" className="shadow-glow">
              <Link href="/directory">
                Browse directory
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary/30 bg-background/50 backdrop-blur">
              <Link href="/rankings">See live rankings</Link>
            </Button>
          </motion.div>

          <motion.div className="grid max-w-2xl grid-cols-1 gap-3 text-sm sm:grid-cols-3" variants={heroItem}>
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="glass-panel rounded-xl p-4"
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
              >
                <motion.div
                  className="text-2xl font-semibold text-primary"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.45 }}
                >
                  {stat.value}
                </motion.div>
                <motion.div className="text-muted-foreground">{stat.label}</motion.div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, rotateX: 8 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ delay: 0.2, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <Hero3DShowcase />
        </motion.div>
      </div>
    </section>
  );
}
