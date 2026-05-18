"use client";

import { useMemo, useState } from "react";
import {
  Award,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock,
  Lock,
  PlayCircle,
  Star
} from "lucide-react";
import type { CourseDetail, CourseLessonView } from "@/types/course";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RemoteImage } from "@/components/ui/remote-image";
import { cn } from "@/lib/utils/cn";
import { getYoutubeEmbed } from "@/lib/courses/video";
import { LessonVideoModal } from "@/components/courses/lesson-video-modal";
import { CertificateActions } from "@/components/courses/certificate-actions";

function getNextLesson(course: CourseDetail): CourseLessonView | null {
  for (const section of course.sections) {
    for (const lesson of section.lessons) {
      if (!lesson.locked && !lesson.completed) {
        return lesson;
      }
    }
  }
  return null;
}

function CourseSidebarCard({
  course,
  enrolling,
  onEnroll,
  className
}: {
  course: CourseDetail;
  enrolling: boolean;
  onEnroll: () => void;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden shadow-glow", className)}>
      {course.thumbnailUrl ? (
        <RemoteImage
          src={course.thumbnailUrl}
          alt={course.title}
          width={640}
          height={360}
          className="aspect-video w-full object-cover"
        />
      ) : null}
      <CardContent className="space-y-4 p-4 sm:p-5">
        {course.enrolled ? (
          <>
            <div className="rounded-lg border bg-secondary/40 p-3 text-sm">
              <p className="font-medium">Your progress</p>
              <p className="mt-1 text-muted-foreground">
                {course.completedLessons} / {course.lessonCount} lessons · {course.progressPercent}%
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-background">
                <div className="h-full bg-primary transition-all" style={{ width: `${course.progressPercent}%` }} />
              </div>
            </div>
            {course.completed || course.progressPercent >= 100 ? (
              <CertificateActions courseSlug={course.slug} className="w-full" />
            ) : (
              <Button className="w-full min-h-[44px]" variant="secondary" disabled>
                Complete all lessons for certificate
              </Button>
            )}
          </>
        ) : (
          <Button className="w-full min-h-[44px]" disabled={enrolling} onClick={onEnroll}>
            {enrolling ? "Enrolling..." : "Enroll in course"}
          </Button>
        )}
        <div>
          <p className="text-sm font-medium">This course also includes:</p>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            {course.includes.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export function CourseDetailClient({ initialCourse }: { initialCourse: CourseDetail }) {
  const [course, setCourse] = useState(initialCourse);
  const [enrolling, setEnrolling] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(course.sections[0]?.id ?? null);
  const [activeLesson, setActiveLesson] = useState<CourseLessonView | null>(null);
  const promoEmbed = getYoutubeEmbed(course.promoVideoUrl);
  const nextLesson = useMemo(() => getNextLesson(course), [course]);

  function handleLessonClick(lesson: CourseLessonView) {
    if (lesson.locked) {
      if (!course.enrolled) {
        toast.error("Enroll to watch", {
          description: "Enroll in this course to unlock all lessons."
        });
      }
      return;
    }
    setActiveLesson(lesson);
  }

  async function handleEnroll() {
    setEnrolling(true);
    try {
      const response = await fetch("/api/courses/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: course.slug })
      });
      const payload = (await response.json()) as {
        error?: string;
        code?: string;
        course?: CourseDetail;
        entitlements?: { planName: string; courseLimit: number | null; enrollmentsUsed: number };
      };

      if (response.status === 401) {
        window.location.href = `/auth/login?next=${encodeURIComponent(`/courses/${course.slug}`)}`;
        return;
      }

      if (response.status === 403 && payload.code === "COURSE_LIMIT_REACHED") {
        const limitLabel = payload.entitlements?.courseLimit ?? 0;
        toast.error("Course limit reached", {
          description: `Your ${payload.entitlements?.planName ?? "plan"} allows ${limitLabel} course${limitLabel === 1 ? "" : "s"}.`,
          action: {
            label: "View pricing",
            onClick: () => {
              window.location.href = "/pricing";
            }
          }
        });
        return;
      }

      if (!response.ok) {
        throw new Error(payload.error ?? "Enrollment failed.");
      }

      if (payload.course) {
        setCourse(payload.course);
      }
      toast.success("Enrolled", {
        description: "You can now access all lessons in this course."
      });
    } catch (error) {
      toast.error("Could not enroll", {
        description: error instanceof Error ? error.message : "Try again in a moment."
      });
    } finally {
      setEnrolling(false);
    }
  }

  async function markLessonComplete(lessonId: string) {
    const response = await fetch(`/api/courses/${course.slug}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId })
    });
    const payload = (await response.json()) as { course?: CourseDetail };
    if (payload.course) {
      setCourse(payload.course);
    }
  }

  return (
    <div className="relative overflow-x-hidden pb-28 lg:pb-0">
      {/* Mobile / tablet: enroll & progress above the fold */}
      <div className="mb-6 lg:hidden">
        <CourseSidebarCard course={course} enrolling={enrolling} onEnroll={() => void handleEnroll()} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_min(280px,360px)] lg:items-start xl:gap-10">
        <main className="min-w-0 space-y-6 sm:space-y-8">
          <header className="space-y-3 sm:space-y-4">
            <div className="flex flex-wrap gap-2">
              {course.categories.map((category) => (
                <Badge key={category} variant="secondary" className="text-xs sm:text-sm">
                  {category}
                </Badge>
              ))}
            </div>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-4xl lg:text-[2.5rem]">
              {course.title}
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">{course.shortDescription}</p>
            <ul className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:flex sm:flex-wrap sm:gap-x-4 sm:gap-y-2 sm:text-sm">
              <li className="flex items-center gap-1 text-amber-500">
                <Star className="h-4 w-4 shrink-0 fill-current" />
                <span>
                  <span className="font-semibold text-foreground">{course.rating.toFixed(1)}</span> / 5 ({course.reviewCount})
                </span>
              </li>
              <li className="flex items-center gap-1">
                <Clock className="h-4 w-4 shrink-0" />
                {course.durationLabel}
              </li>
              <li className="flex items-center gap-1">
                <PlayCircle className="h-4 w-4 shrink-0" />
                {course.lessonCount} lessons
              </li>
              {course.releasedLabel ? (
                <li className="col-span-2 flex items-center gap-1 sm:col-span-1">
                  <Bell className="h-4 w-4 shrink-0" />
                  <span className="truncate">Released: {course.releasedLabel}</span>
                </li>
              ) : null}
            </ul>
          </header>

          {promoEmbed ? (
            <div className="overflow-hidden rounded-xl border bg-black shadow-glow sm:rounded-2xl">
              <div className="aspect-video w-full">
                <iframe
                  src={promoEmbed}
                  title={`${course.title} promo`}
                  className="h-full w-full"
                  allowFullScreen
                />
              </div>
            </div>
          ) : null}

          {course.learningObjectives.length ? (
            <Card>
              <CardContent className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
                {course.learningObjectives.map((item) => (
                  <div key={item} className="flex gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <section className="space-y-2 sm:space-y-3">
            <h2 className="text-xl font-semibold sm:text-2xl">Description</h2>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground sm:text-base">{course.description}</p>
          </section>

          {course.targetAudience.length ? (
            <section className="space-y-2 sm:space-y-3">
              <h2 className="text-xl font-semibold sm:text-2xl">Who This Course is For</h2>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground sm:text-base">
                {course.targetAudience.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {course.requirements.length ? (
            <section className="space-y-2 sm:space-y-3">
              <h2 className="text-xl font-semibold sm:text-2xl">Requirements</h2>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground sm:text-base">
                {course.requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="space-y-3 sm:space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-xl font-semibold sm:text-2xl">Curriculum</h2>
              <span className="text-xs text-muted-foreground sm:text-sm">{course.lessonCount} lessons</span>
            </div>
            <div className="space-y-3">
              {course.sections.map((section) => {
                const isOpen = openSection === section.id;
                return (
                  <Card key={section.id}>
                    <button
                      type="button"
                      className="flex min-h-[52px] w-full items-center justify-between gap-3 p-3 text-left sm:p-4"
                      onClick={() => setOpenSection(isOpen ? null : section.id)}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-medium leading-snug">{section.title}</p>
                        <p className="text-xs text-muted-foreground">{section.durationLabel}</p>
                      </div>
                      <ChevronDown className={cn("h-4 w-4 shrink-0 transition", isOpen && "rotate-180")} />
                    </button>
                    {isOpen ? (
                      <CardContent className="space-y-2 border-t p-3 pt-0 sm:p-4">
                        {section.lessons.map((lesson, index) => (
                          <div
                            key={lesson.id}
                            className={cn(
                              "rounded-lg border bg-secondary/30 p-3 text-sm",
                              !lesson.locked && "cursor-pointer transition hover:border-primary/40 hover:bg-secondary/50"
                            )}
                            role={lesson.locked ? undefined : "button"}
                            tabIndex={lesson.locked ? undefined : 0}
                            onClick={() => handleLessonClick(lesson)}
                            onKeyDown={(event) => {
                              if (!lesson.locked && (event.key === "Enter" || event.key === " ")) {
                                event.preventDefault();
                                handleLessonClick(lesson);
                              }
                            }}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex min-w-0 items-start gap-3">
                                {lesson.completed ? (
                                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                ) : lesson.locked ? (
                                  <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                                ) : (
                                  <PlayCircle className="h-4 w-4 shrink-0 text-primary" />
                                )}
                                <div className="min-w-0 space-y-1">
                                  <p className="font-medium leading-snug">
                                    {index + 1}. {lesson.title}
                                  </p>
                                  {lesson.isPreview ? (
                                    <Badge variant="outline" className="text-[10px] sm:text-xs">
                                      Preview
                                    </Badge>
                                  ) : null}
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-2 sm:shrink-0 sm:justify-end">
                                <span className="text-xs text-muted-foreground sm:text-sm">{lesson.durationLabel}</span>
                                {course.enrolled && !lesson.locked && !lesson.completed ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="min-h-[36px] shrink-0"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void markLessonComplete(lesson.id);
                                    }}
                                  >
                                    Complete
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Instructor & FAQ in main column on mobile */}
          <div className="space-y-4 lg:hidden">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                {course.instructorAvatarUrl ? (
                  <RemoteImage
                    src={course.instructorAvatarUrl}
                    alt={course.instructorName}
                    width={56}
                    height={56}
                    className="h-12 w-12 shrink-0 rounded-full object-cover sm:h-14 sm:w-14"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-lg font-semibold sm:h-14 sm:w-14">
                    {course.instructorName.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Instructor</p>
                  <p className="font-semibold">{course.instructorName}</p>
                  {course.instructorTitle ? (
                    <p className="text-sm text-muted-foreground">{course.instructorTitle}</p>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {course.faqs.length ? (
              <Card>
                <CardContent className="space-y-4 p-4">
                  <p className="font-semibold">FAQ</p>
                  {course.faqs.map((faq) => (
                    <div key={faq.id} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                      <p className="text-sm font-medium">{faq.question}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{faq.answer}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex items-start gap-3 p-4 text-sm">
                <Award className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p>Finish every lesson to unlock your downloadable certificate of completion.</p>
              </CardContent>
            </Card>
          </div>

          {course.reviews.length ? (
            <section className="space-y-3 sm:space-y-4">
              <h2 className="text-xl font-semibold sm:text-2xl">Recent Reviews</h2>
              <div className="grid gap-3 sm:gap-4">
                {course.reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="space-y-2 p-4 sm:p-5">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-semibold">{review.authorName}</p>
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: review.rating }).map((_, index) => (
                            <Star key={index} className="h-3.5 w-3.5 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="font-medium">{review.title}</p>
                      <p className="text-sm text-muted-foreground">{review.body}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}
        </main>

        {/* Desktop sidebar */}
        <aside className="hidden space-y-4 lg:sticky lg:top-20 lg:block lg:self-start xl:top-24">
          <CourseSidebarCard course={course} enrolling={enrolling} onEnroll={() => void handleEnroll()} />

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              {course.instructorAvatarUrl ? (
                <RemoteImage
                  src={course.instructorAvatarUrl}
                  alt={course.instructorName}
                  width={56}
                  height={56}
                  className="h-14 w-14 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary text-lg font-semibold">
                  {course.instructorName.slice(0, 1)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Instructor</p>
                <p className="font-semibold">{course.instructorName}</p>
                {course.instructorTitle ? (
                  <p className="text-sm text-muted-foreground">{course.instructorTitle}</p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {course.faqs.length ? (
            <Card>
              <CardContent className="space-y-3 p-4">
                <p className="font-semibold">FAQ</p>
                {course.faqs.map((faq) => (
                  <div key={faq.id}>
                    <p className="text-sm font-medium">{faq.question}</p>
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-start gap-3 p-4 text-sm">
              <Award className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p>Finish every lesson to unlock your downloadable certificate of completion.</p>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Mobile sticky bar: continue learning */}
      {course.enrolled && nextLesson ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-lg lg:hidden">
          <div className="container flex max-w-lg flex-col gap-2 sm:mx-auto sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Continue learning</p>
              <p className="truncate text-sm font-medium">{nextLesson.title}</p>
            </div>
            <Button className="min-h-[44px] w-full shrink-0 sm:w-auto" onClick={() => handleLessonClick(nextLesson)}>
              <PlayCircle className="mr-2 h-4 w-4" />
              Resume lesson
            </Button>
          </div>
        </div>
      ) : null}

      {course.enrolled && !nextLesson && (course.completed || course.progressPercent >= 100) ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-lg lg:hidden">
          <div className="container max-w-lg sm:mx-auto">
            <CertificateActions courseSlug={course.slug} className="w-full min-h-[44px]" />
          </div>
        </div>
      ) : null}

      <LessonVideoModal lesson={activeLesson} onClose={() => setActiveLesson(null)} />
    </div>
  );
}
