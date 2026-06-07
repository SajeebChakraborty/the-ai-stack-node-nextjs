"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, PlayCircle, Sparkles, TrendingUp } from "lucide-react";
import type { CourseListItem } from "@/types/course";
import { HeroSearch } from "@/components/home/hero-search";
import { AiCoreShowcase } from "@/components/home/ai-core-showcase";
import { LiveStat } from "@/components/home/live-stat";
import { GradientText } from "@/components/home/gradient-text";
import { RemoteImage } from "@/components/ui/remote-image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { heroItem, heroStagger } from "@/lib/motion/variants";

type HomeHeroProps = {
  stats: ReadonlyArray<{ value: string; label: string }>;
  spotlightCourse: CourseListItem | null;
};

const trustChips = [
  "Self-paced video courses",
  "Buyer-trusted directory",
  "Verified certificates"
];

export function HomeHero({ stats, spotlightCourse }: HomeHeroProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden">
      {/* Animated background layers */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="landing-grid absolute inset-0 animate-grid-pan opacity-70" />
        <div className="absolute -left-32 top-6 h-[30rem] w-[30rem] rounded-full bg-primary/25 blur-[130px] animate-aurora" />
        <div className="absolute -right-24 top-28 h-[28rem] w-[28rem] rounded-full bg-violet-600/20 blur-[130px] animate-aurora [animation-delay:3s]" />
        <div className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-cyan-500/15 blur-[130px] animate-aurora [animation-delay:6s]" />
      </div>

      <div className="container relative grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:py-24">
        <motion.div
          className="space-y-7"
          variants={heroStagger}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={heroItem}>
            <Badge
              variant="outline"
              className="w-fit gap-2 border-primary/40 bg-white/5 px-3 py-1 text-white/80 backdrop-blur"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI academy + verified tool directory
            </Badge>
          </motion.div>

          <motion.div className="space-y-5" variants={heroItem}>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[4.25rem]">
              Master AI.{" "}
              <GradientText className="text-glow">Discover</GradientText>
              <br className="hidden sm:block" /> what works.
            </h1>
            <p className="max-w-xl text-base text-white/65 sm:text-lg">
              Video courses with certificates, plus a buyer-trusted directory of AI tools—ranked by reviews,
              momentum, and real proof.
            </p>
          </motion.div>

          <motion.div variants={heroItem}>
            <HeroSearch />
          </motion.div>

          <motion.div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap" variants={heroItem}>
            <motion.div whileHover={reduceMotion ? undefined : { scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Button asChild size="lg" className="h-12 w-full shadow-glow sm:w-auto">
                <Link href="/courses">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Start learning
                </Link>
              </Button>
            </motion.div>
            <motion.div whileHover={reduceMotion ? undefined : { scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 w-full border-white/20 bg-white/5 text-white hover:bg-white/10 sm:w-auto"
              >
                <Link href="/directory">
                  Explore directory
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.ul className="flex flex-wrap gap-x-5 gap-y-2" variants={heroItem}>
            {trustChips.map((chip) => (
              <li key={chip} className="flex items-center gap-1.5 text-sm text-white/60">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                {chip}
              </li>
            ))}
          </motion.ul>

          <motion.ul
            className="grid grid-cols-2 gap-3 border-t border-white/10 pt-6 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5"
            variants={heroItem}
          >
            {stats.map((stat, index) => (
              <motion.li
                key={stat.label}
                className="text-center sm:text-left"
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.06, duration: 0.45 }}
              >
                <p className="text-xl font-bold text-primary sm:text-2xl">{stat.value}</p>
                <p className="text-[10px] text-white/50 sm:text-xs">{stat.label}</p>
              </motion.li>
            ))}
            <LiveStat label="learner views" seedMin={95_000} />
            <LiveStat label="course enrollments" seedMin={65_000} />
          </motion.ul>
        </motion.div>

        <div className="relative space-y-4">
          <AiCoreShowcase />

          {spotlightCourse ? (
            <motion.div
              className="glow-card glow-card-hover overflow-hidden p-4 sm:p-5"
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
            >
              <div className="flex items-center gap-4">
                {spotlightCourse.thumbnailUrl ? (
                  <div className="relative hidden h-20 w-32 shrink-0 overflow-hidden rounded-lg sm:block">
                    <RemoteImage
                      src={spotlightCourse.thumbnailUrl}
                      alt={spotlightCourse.title}
                      width={256}
                      height={160}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
                    <Badge variant="premium">Featured course</Badge>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      {spotlightCourse.lessonCount} lessons
                    </span>
                  </div>
                  <h2 className="mt-1.5 truncate font-display text-base font-semibold sm:text-lg">
                    {spotlightCourse.title}
                  </h2>
                  <Link
                    href={`/courses/${spotlightCourse.slug}`}
                    className="mt-1 inline-flex items-center text-sm font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    Watch course preview
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
