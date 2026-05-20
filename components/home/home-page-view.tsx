"use client";

import Link from "next/link";
import { ArrowRight, Quote } from "lucide-react";
import type { HomePageData } from "@/lib/content/home-static";
import { HomeHero } from "@/components/home/home-hero";
import { CourseShowcaseCard } from "@/components/home/course-showcase-card";
import { ToolSpotlightCard } from "@/components/home/tool-spotlight-card";
import { ScrollReveal, StaggerItem, StaggerReveal } from "@/components/home/scroll-reveal";
import { homeFaqItems } from "@/lib/content/home-faq";
import { homeSteps, homeValueProps } from "@/lib/content/home-copy";
import { Section, SectionShell } from "@/components/layout/section";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export type { HomePageData };

export function HomePageView({ data }: { data: HomePageData }) {
  const heroStats = [
    { value: `${data.stats.toolCount.toLocaleString()}+`, label: "AI tools indexed" },
    { value: `${Math.max(data.stats.courseCount, 1)}+`, label: "video courses" },
    { value: "4.8★", label: "avg. course rating" }
  ];

  const [leadCourse, ...gridCourses] = data.featuredCourses;
  const [leadTool, ...otherTools] = data.trendingTools;

  return (
    <div className="overflow-x-hidden">
      <HomeHero stats={heroStats} spotlightCourse={data.spotlightCourse ?? leadCourse ?? null} />

      {/* Value strip */}
      <section className="border-b bg-muted/20 py-10 sm:py-12">
        <SectionShell>
          <StaggerReveal className="grid gap-6 md:grid-cols-3">
            {homeValueProps.map((item, index) => (
              <StaggerItem key={item.title}>
                <div
                  className={cn(
                    "rounded-2xl border border-border/50 bg-gradient-to-br p-6 transition-shadow duration-300 hover:shadow-glow sm:p-8",
                    item.accent
                  )}
                  style={{ transitionDelay: `${index * 40}ms` }}
                >
                  <h3 className="font-display text-lg font-semibold sm:text-xl">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{item.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </SectionShell>
      </section>

      {/* Courses */}
      <Section>
        <SectionShell>
          <ScrollReveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl space-y-2">
              <Badge variant="outline" className="border-primary/30 text-primary">
                Academy
              </Badge>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Learn AI with video-first courses
              </h2>
              <p className="text-muted-foreground sm:text-lg">
                Watch lessons, track progress, and earn certificates—built for founders and builders who learn by doing.
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link href="/courses">
                All courses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </ScrollReveal>

          <StaggerReveal className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5" delayChildren={0.08}>
            {leadCourse ? (
              <StaggerItem className="sm:col-span-2 lg:col-span-2">
                <CourseShowcaseCard course={leadCourse} featured className="sm:col-span-2 lg:col-span-2" />
              </StaggerItem>
            ) : null}
            {gridCourses.slice(0, leadCourse ? 4 : 6).map((course) => (
              <StaggerItem key={course.id}>
                <CourseShowcaseCard course={course} />
              </StaggerItem>
            ))}
          </StaggerReveal>
        </SectionShell>
      </Section>

      {/* Trending tools */}
      <Section className="border-y bg-secondary/15">
        <SectionShell>
          <ScrollReveal direction="right" className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl space-y-2">
              <Badge variant="outline">Directory</Badge>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Trending tools with video previews
              </h2>
              <p className="text-muted-foreground sm:text-lg">
                See what&apos;s rising in the market—ranked by trust, reviews, and growth signals.
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link href="/directory">
                Browse directory
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </ScrollReveal>

          {leadTool ? (
            <StaggerReveal className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2" delayChildren={0.1}>
              <StaggerItem className="lg:col-span-2 lg:row-span-2">
                <ToolSpotlightCard tool={leadTool} rank={1} large className="lg:col-span-2 lg:row-span-2" />
              </StaggerItem>
              {otherTools.slice(0, 4).map((tool, index) => (
                <StaggerItem key={tool.id}>
                  <ToolSpotlightCard tool={tool} rank={index + 2} />
                </StaggerItem>
              ))}
            </StaggerReveal>
          ) : null}
        </SectionShell>
      </Section>

      {/* How it works */}
      <Section>
        <SectionShell>
          <ScrollReveal>
            <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">How TheAiStack works</h2>
          </ScrollReveal>
          <StaggerReveal className="mt-10 grid gap-8 md:grid-cols-3">
            {homeSteps.map((step) => (
              <StaggerItem key={step.step}>
                <div className="relative pl-14 transition-transform duration-300 hover:-translate-y-1 md:pl-0 md:pt-14 md:text-center">
                  <span className="absolute left-0 top-0 font-display text-4xl font-bold text-primary/30 md:left-1/2 md:-translate-x-1/2 md:text-5xl">
                    {step.step}
                  </span>
                  <h3 className="font-semibold md:mt-2">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </SectionShell>
      </Section>

      {/* Testimonials */}
      {data.recentReviews.length > 0 ? (
        <Section className="bg-gradient-to-b from-muted/40 to-background">
          <SectionShell>
            <ScrollReveal>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">Trusted by real buyers</h2>
            </ScrollReveal>
            <StaggerReveal className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {data.recentReviews.map((review) => (
                <StaggerItem key={review.id}>
                  <blockquote className="relative rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/25 hover:shadow-glow">
                    <Quote className="mb-3 h-8 w-8 text-primary/40" />
                    <p className="font-medium leading-snug">&ldquo;{review.title}&rdquo;</p>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{review.body}</p>
                    <footer className="mt-4 text-xs text-muted-foreground">
                      {review.authorName} ·{" "}
                      <Link href={`/tools/${review.toolSlug}`} className="text-primary hover:underline">
                        {review.toolName}
                      </Link>
                    </footer>
                  </blockquote>
                </StaggerItem>
              ))}
            </StaggerReveal>
          </SectionShell>
        </Section>
      ) : null}

      {/* Membership CTA */}
      {data.plans[0] ? (
        <Section>
          <SectionShell>
            <ScrollReveal direction="up">
              <div className="overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/15 via-background to-violet-950/20 p-8 transition-shadow duration-500 hover:shadow-glow sm:p-12">
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
            </ScrollReveal>
          </SectionShell>
        </Section>
      ) : null}

      {/* FAQ */}
      <Section compact className="border-t">
        <SectionShell>
          <ScrollReveal>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Frequently asked questions</h2>
          </ScrollReveal>
          <StaggerReveal className="mt-6 w-full max-w-3xl" delayChildren={0.06}>
            <Accordion type="single" collapsible className="w-full">
              {homeFaqItems.map((item) => (
                <StaggerItem key={item.id}>
                  <AccordionItem value={item.id}>
                    <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
                  </AccordionItem>
                </StaggerItem>
              ))}
            </Accordion>
          </StaggerReveal>
        </SectionShell>
      </Section>
    </div>
  );
}
