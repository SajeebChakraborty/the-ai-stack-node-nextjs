"use client";

import { useState } from "react";
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
import type { CourseDetail } from "@/types/course";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RemoteImage } from "@/components/ui/remote-image";
import { cn } from "@/lib/utils/cn";
import { getYoutubeEmbed } from "@/lib/courses/video";
import { LessonVideoModal } from "@/components/courses/lesson-video-modal";
import { CertificateActions } from "@/components/courses/certificate-actions";
import type { CourseLessonView } from "@/types/course";

export function CourseDetailClient({ initialCourse }: { initialCourse: CourseDetail }) {
  const [course, setCourse] = useState(initialCourse);
  const [enrolling, setEnrolling] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(course.sections[0]?.id ?? null);
  const [activeLesson, setActiveLesson] = useState<CourseLessonView | null>(null);
  const promoEmbed = getYoutubeEmbed(course.promoVideoUrl);

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
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {course.categories.map((category) => (
              <Badge key={category} variant="secondary">
                {category}
              </Badge>
            ))}
          </div>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">{course.title}</h1>
          <p className="text-lg text-muted-foreground">{course.shortDescription}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1 text-amber-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="font-semibold text-foreground">{course.rating.toFixed(1)}</span> / 5
              <span>({course.reviewCount})</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {course.durationLabel}
            </span>
            <span>{course.lessonCount} lessons</span>
            {course.releasedLabel ? (
              <span className="flex items-center gap-1">
                <Bell className="h-4 w-4" />
                Released: {course.releasedLabel}
              </span>
            ) : null}
          </div>
        </div>

        {promoEmbed ? (
          <div className="overflow-hidden rounded-2xl border bg-black shadow-glow">
            <div className="aspect-video">
              <iframe src={promoEmbed} title={`${course.title} promo`} className="h-full w-full" allowFullScreen />
            </div>
          </div>
        ) : null}

        {course.learningObjectives.length ? (
          <Card>
            <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
              {course.learningObjectives.map((item) => (
                <div key={item} className="flex gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Description</h2>
          <p className="whitespace-pre-wrap text-muted-foreground">{course.description}</p>
        </section>

        {course.targetAudience.length ? (
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Who This Course is For</h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              {course.targetAudience.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {course.requirements.length ? (
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Requirements</h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              {course.requirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">Curriculum</h2>
            <span className="text-sm text-muted-foreground">{course.lessonCount} lessons</span>
          </div>
          <div className="space-y-3">
            {course.sections.map((section) => {
              const isOpen = openSection === section.id;
              return (
                <Card key={section.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 p-4 text-left"
                    onClick={() => setOpenSection(isOpen ? null : section.id)}
                  >
                    <div>
                      <p className="font-medium">{section.title}</p>
                      <p className="text-xs text-muted-foreground">{section.durationLabel}</p>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 transition", isOpen && "rotate-180")} />
                  </button>
                  {isOpen ? (
                    <CardContent className="space-y-2 border-t p-4 pt-0">
                      {section.lessons.map((lesson, index) => (
                        <div
                          key={lesson.id}
                          className={cn(
                            "flex items-center justify-between gap-3 rounded-lg border bg-secondary/30 p-3 text-sm",
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
                          <div className="flex min-w-0 items-center gap-3">
                            {lesson.completed ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                            ) : lesson.locked ? (
                              <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                            ) : (
                              <PlayCircle className="h-4 w-4 shrink-0 text-primary" />
                            )}
                            <span className="truncate">
                              {index + 1}. {lesson.title}
                            </span>
                            {lesson.isPreview ? (
                              <Badge variant="outline" className="shrink-0">
                                Preview
                              </Badge>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-muted-foreground">{lesson.durationLabel}</span>
                            {course.enrolled && !lesson.locked && !lesson.completed ? (
                              <Button
                                size="sm"
                                variant="outline"
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
                      ))}
                    </CardContent>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </section>

        {course.reviews.length ? (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Recent Reviews</h2>
            <div className="grid gap-4">
              {course.reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="space-y-2 p-5">
                    <div className="flex items-center justify-between gap-3">
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
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="overflow-hidden shadow-glow">
          {course.thumbnailUrl ? (
            <RemoteImage
              src={course.thumbnailUrl}
              alt={course.title}
              width={640}
              height={360}
              className="aspect-video w-full object-cover"
            />
          ) : null}
          <CardContent className="space-y-4 p-5">
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
                  <Button className="w-full" variant="secondary" disabled>
                    Complete all lessons for certificate
                  </Button>
                )}
              </>
            ) : (
              <Button className="w-full" disabled={enrolling} onClick={() => void handleEnroll()}>
                {enrolling ? "Enrolling..." : "Enroll in course"}
              </Button>
            )}
            <div>
              <p className="text-sm font-medium">This course also includes:</p>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                {course.includes.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            {course.instructorAvatarUrl ? (
              <RemoteImage
                src={course.instructorAvatarUrl}
                alt={course.instructorName}
                width={56}
                height={56}
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-lg font-semibold">
                {course.instructorName.slice(0, 1)}
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Instructor</p>
              <p className="font-semibold">{course.instructorName}</p>
              {course.instructorTitle ? <p className="text-sm text-muted-foreground">{course.instructorTitle}</p> : null}
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
            <Award className="mt-0.5 h-5 w-5 text-primary" />
            <p>Finish every lesson to unlock your downloadable certificate of completion.</p>
          </CardContent>
        </Card>
      </aside>

      <LessonVideoModal lesson={activeLesson} onClose={() => setActiveLesson(null)} />
    </div>
  );
}
