"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Compass, GraduationCap, Star } from "lucide-react";
import type { CourseListItem } from "@/types/course";
import type { DirectoryTool } from "@/types/directory";
import type { PremiumPlan } from "@/types/domain";
import { Hero } from "@/components/home/hero";
import { homeFaqItems } from "@/lib/content/home-faq";
import { typography, layout } from "@/lib/design/tokens";
import { ToolCard } from "@/components/directory/tool-card";
import { Section, SectionShell } from "@/components/layout/section";
import { PageHeader } from "@/components/layout/page-header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RemoteImage } from "@/components/ui/remote-image";
import { cn } from "@/lib/utils/cn";

export type HomePageData = {
  stats: { toolCount: number; courseCount: number; memberCount: number };
  featuredCourses: CourseListItem[];
  trendingTools: DirectoryTool[];
  recentReviews: Array<{
    id: string;
    rating: number;
    title: string;
    body: string;
    toolName: string;
    toolSlug: string;
    authorName: string;
  }>;
  plans: PremiumPlan[];
};

export function HomePageView({ data }: { data: HomePageData }) {
  const heroStats = [
    { value: `${data.stats.toolCount}+`, label: "AI tools indexed" },
    { value: `${data.stats.courseCount}+`, label: "video courses" },
    { value: "4.8★", label: "avg. course rating" }
  ];

  return (
    <div className="overflow-x-hidden">
      <Hero stats={heroStats} />
      <Section>
        <SectionShell>
          <PageHeader
            variant="marketing"
            eyebrow="Courses"
            title="Learn AI skills that matter"
            description="Structured lessons, progress tracking, and certificates when you finish."
            actionHref="/courses"
            actionLabel="Browse all courses"
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.featuredCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden transition hover:shadow-glow">
                <div className="relative aspect-video bg-secondary">
                  {course.thumbnailUrl ? (
                    <RemoteImage
                      src={course.thumbnailUrl}
                      alt={course.title}
                      width={640}
                      height={360}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <GraduationCap className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <CardContent className="space-y-3 p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Course · {course.lessonCount} lessons · {course.reviewCount} reviews
                  </p>
                  <h3 className={cn(typography.h3, "line-clamp-2")}>
                    <Link href={`/courses/${course.slug}`} className="hover:text-primary">
                      {course.title}
                    </Link>
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    {course.rating.toFixed(1)}
                  </div>
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link href={`/courses/${course.slug}`}>View course</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </SectionShell>
      </Section>

      <Section className="border-y bg-secondary/20">
        <SectionShell>
          <PageHeader
            eyebrow="Directory"
            title="Trending AI tools"
            actionHref="/directory"
            actionLabel="View directory"
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.trendingTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} analyticsSource="home" />
            ))}
          </div>
        </SectionShell>
      </Section>

      <Section>
        <SectionShell>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: BookOpen, title: "On-demand courses", text: "Video lessons you can take at your own pace." },
              { icon: Compass, title: "Trusted directory", text: "Compare tools with reviews, pricing, and rankings." },
              { icon: GraduationCap, title: "Certificates", text: "Prove completion with verified PDF credentials." }
            ].map((item) => (
              <Card key={item.title} className="academy-surface">
                <CardContent className="space-y-3 p-6">
                  <item.icon className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </SectionShell>
      </Section>

      {data.recentReviews.length > 0 ? (
        <Section className="bg-muted/30">
          <SectionShell>
            <PageHeader eyebrow="Reviews" title="What buyers are saying" />
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.recentReviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="font-medium">{review.title}</p>
                    <p className="line-clamp-3 text-sm text-muted-foreground">{review.body}</p>
                    <p className="text-xs text-muted-foreground">
                      {review.authorName} on{" "}
                      <Link href={`/tools/${review.toolSlug}`} className="text-primary hover:underline">
                        {review.toolName}
                      </Link>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </SectionShell>
        </Section>
      ) : null}

      {data.plans[0] ? (
        <Section>
          <SectionShell>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center">
                <div className="space-y-2">
                  <Badge variant="premium">Membership</Badge>
                  <h3 className={typography.h2}>Unlock every course on TheAiStack</h3>
                  <p className={typography.body}>Plans include course enrollments, certificates, and directory perks.</p>
                </div>
                <Button asChild size="lg">
                  <Link href="/pricing">
                    View pricing
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </SectionShell>
        </Section>
      ) : null}

      <Section compact>
        <SectionShell className={layout.academyContainer}>
          <PageHeader variant="academy" title="Frequently asked questions" />
          <Accordion type="single" collapsible className="mt-6 w-full">
            {homeFaqItems.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </SectionShell>
      </Section>
    </div>
  );
}
