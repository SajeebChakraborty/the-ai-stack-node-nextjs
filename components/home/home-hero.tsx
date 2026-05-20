"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, PlayCircle, Sparkles, TrendingUp } from "lucide-react";
import type { CourseListItem } from "@/types/course";
import { HeroSearch } from "@/components/home/hero-search";
import { HeroFeaturedVideo } from "@/components/home/hero-featured-video";
import { LiveStat } from "@/components/home/live-stat";
import { GradientText } from "@/components/home/gradient-text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { heroItem, heroStagger } from "@/lib/motion/variants";

type HomeHeroProps = {
  stats: ReadonlyArray<{ value: string; label: string }>;
  spotlightCourse: CourseListItem | null;
};

export function HomeHero({ stats, spotlightCourse }: HomeHeroProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,hsl(var(--primary)/0.22),transparent)]" />
      <motion.div
        className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl"
        animate={reduceMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.5, 0.75, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        animate={reduceMotion ? undefined : { scale: [1, 1.12, 1], opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="container relative grid gap-10 py-14 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-20">
        <motion.div
          className="space-y-6 sm:space-y-8"
          variants={heroStagger}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={heroItem}>
            <Badge variant="outline" className="w-fit gap-2 border-primary/30 bg-background/60 px-3 py-1 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI academy + verified tool directory
            </Badge>
          </motion.div>

          <motion.div className="space-y-4" variants={heroItem}>
            <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Master AI. <GradientText>Discover</GradientText> what works.
            </h1>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              Video courses with certificates, plus a buyer-trusted directory of AI tools—ranked by reviews,
              momentum, and real proof.
            </p>
          </motion.div>

          <motion.div variants={heroItem}>
            <HeroSearch />
          </motion.div>

          <motion.div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap" variants={heroItem}>
            <Button asChild size="lg" className="h-12 shadow-glow">
              <Link href="/courses">
                <PlayCircle className="mr-2 h-5 w-5" />
                Start learning
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 border-primary/25 bg-background/50">
              <Link href="/directory">
                Explore directory
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          <motion.ul
            className="grid grid-cols-2 gap-3 border-t border-border/60 pt-6 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5"
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
                <p className="text-[10px] text-muted-foreground sm:text-xs">{stat.label}</p>
              </motion.li>
            ))}
            <LiveStat label="learner views" seedMin={95_000} />
            <LiveStat label="course enrollments" seedMin={65_000} />
          </motion.ul>
        </motion.div>

        <motion.div
          className="relative space-y-4"
          initial={reduceMotion ? false : { opacity: 0, x: 40, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            whileHover={reduceMotion ? undefined : { scale: 1.01 }}
            transition={{ duration: 0.3 }}
          >
            <HeroFeaturedVideo title={spotlightCourse?.title ?? "TheAiStack featured course"} className="w-full" />
          </motion.div>
          {spotlightCourse ? (
            <motion.div
              className="rounded-2xl border border-border/80 bg-card/80 p-4 backdrop-blur sm:p-5"
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.45 }}
            >
              <motion.div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="premium">Featured course</Badge>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  {spotlightCourse.lessonCount} lessons
                </span>
              </motion.div>
              <h2 className="mt-2 font-display text-lg font-semibold leading-snug sm:text-xl">{spotlightCourse.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{spotlightCourse.shortDescription}</p>
              <Button asChild className="mt-4 w-full sm:w-auto" size="sm">
                <Link href={`/courses/${spotlightCourse.slug}`}>Watch course preview</Link>
              </Button>
            </motion.div>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
