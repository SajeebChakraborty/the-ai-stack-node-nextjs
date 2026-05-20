"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Clock, PlayCircle, Star } from "lucide-react";
import { cardHover } from "@/lib/motion/variants";
import type { CourseListItem } from "@/types/course";
import { PromoVideo } from "@/components/home/promo-video";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function CourseShowcaseCard({
  course,
  featured = false,
  className
}: {
  course: CourseListItem;
  featured?: boolean;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/40 shadow-sm transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-glow",
        featured && "lg:col-span-2 lg:row-span-2",
        className
      )}
      whileHover={reduceMotion ? undefined : cardHover}
    >
      <div className={cn("relative", featured ? "aspect-[16/10] lg:aspect-auto lg:min-h-[280px]" : "aspect-video")}>
        <PromoVideo
          videoUrl={course.promoVideoUrl}
          posterUrl={course.thumbnailUrl}
          title={course.title}
          className="h-full rounded-none border-0 shadow-none"
          aspectClassName="h-full min-h-full"
          showPlayOverlay={Boolean(course.promoVideoUrl)}
        />
        <motion.div
          className="absolute left-3 top-3 flex flex-wrap gap-2"
          initial={reduceMotion ? false : { opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {course.featured ? <Badge variant="premium">Featured</Badge> : null}
          <Badge variant="secondary" className="capitalize">
            {course.level}
          </Badge>
        </motion.div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Course · {course.lessonCount} lessons
        </p>
        <h3 className="font-display text-lg font-semibold leading-snug transition group-hover:text-primary sm:text-xl">
          <Link href={`/courses/${course.slug}`}>{course.title}</Link>
        </h3>
        <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">{course.shortDescription}</p>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-3">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1 text-amber-500">
              <Star className="h-4 w-4 fill-current" />
              {course.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {course.durationLabel}
            </span>
          </div>
          <Button asChild size="sm" variant="secondary" className="shrink-0">
            <Link href={`/courses/${course.slug}`}>
              <PlayCircle className="mr-1.5 h-4 w-4" />
              Start
            </Link>
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
