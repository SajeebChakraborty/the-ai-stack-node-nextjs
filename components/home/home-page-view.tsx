"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HomePageData } from "@/lib/content/home-static";
import { HomeHero } from "@/components/home/home-hero";
import { CourseShowcaseCard } from "@/components/home/course-showcase-card";
import { ToolSpotlightCard } from "@/components/home/tool-spotlight-card";
import { MembershipCta } from "@/components/home/membership-cta";
import { ReviewQuoteCard } from "@/components/home/review-quote-card";
import { ScrollReveal, SectionHeader, StaggerItem, StaggerReveal } from "@/components/home/scroll-reveal";
import { StepCard } from "@/components/home/step-card";
import { ValuePropCard } from "@/components/home/value-prop-card";
import { homeFaqItems } from "@/lib/content/home-faq";
import { homeSteps, homeValueProps } from "@/lib/content/home-copy";
import { Section, SectionShell } from "@/components/layout/section";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

      <section className="border-b bg-muted/20 py-10 sm:py-12">
        <SectionShell>
          <StaggerReveal className="grid gap-6 md:grid-cols-3">
            {homeValueProps.map((item) => (
              <StaggerItem key={item.title}>
                <ValuePropCard title={item.title} description={item.description} accent={item.accent} />
              </StaggerItem>
            ))}
          </StaggerReveal>
        </SectionShell>
      </section>

      <Section>
        <SectionShell>
          <SectionHeader
            eyebrow={
              <Badge variant="outline" className="border-primary/30 text-primary">
                Academy
              </Badge>
            }
            title="Learn AI with video-first courses"
            description="Watch lessons, track progress, and earn certificates—built for founders and builders who learn by doing."
            action={
              <Button asChild variant="outline">
                <Link href="/courses">
                  All courses
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            }
          />

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

      <Section className="border-y bg-secondary/15">
        <SectionShell>
          <SectionHeader
            direction="right"
            eyebrow={<Badge variant="outline">Directory</Badge>}
            title="Trending tools with video previews"
            description="See what's rising in the market—ranked by trust, reviews, and growth signals."
            action={
              <Button asChild variant="outline">
                <Link href="/directory">
                  Browse directory
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            }
          />

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

      <Section>
        <SectionShell>
          <SectionHeader align="center" title="How TheAiStack works" />
          <StaggerReveal className="mt-10 grid gap-6 md:grid-cols-3">
            {homeSteps.map((step) => (
              <StaggerItem key={step.step}>
                <StepCard step={step.step} title={step.title} text={step.text} />
              </StaggerItem>
            ))}
          </StaggerReveal>
        </SectionShell>
      </Section>

      {data.recentReviews.length > 0 ? (
        <Section className="bg-gradient-to-b from-muted/40 to-background">
          <SectionShell>
            <SectionHeader title="Trusted by real buyers" />
            <StaggerReveal className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {data.recentReviews.map((review) => (
                <StaggerItem key={review.id}>
                  <ReviewQuoteCard
                    title={review.title}
                    body={review.body}
                    authorName={review.authorName}
                    toolName={review.toolName}
                    toolSlug={review.toolSlug}
                  />
                </StaggerItem>
              ))}
            </StaggerReveal>
          </SectionShell>
        </Section>
      ) : null}

      {data.plans[0] ? (
        <Section>
          <SectionShell>
            <ScrollReveal direction="scale">
              <MembershipCta />
            </ScrollReveal>
          </SectionShell>
        </Section>
      ) : null}

      <Section compact className="border-t">
        <SectionShell>
          <SectionHeader title="Frequently asked questions" />
          <StaggerReveal className="mt-6 w-full max-w-3xl" delayChildren={0.06}>
            <Accordion type="single" collapsible className="w-full">
              {homeFaqItems.map((item) => (
                <StaggerItem key={item.id}>
                  <AccordionItem value={item.id} className="transition-colors data-[state=open]:border-primary/30">
                    <AccordionTrigger className="text-left transition-colors hover:text-primary">
                      {item.question}
                    </AccordionTrigger>
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
