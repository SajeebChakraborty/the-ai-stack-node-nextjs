"use client";

import Link from "next/link";
import { Award, BookOpen, PlayCircle } from "lucide-react";
import { CertificateActions } from "@/components/courses/certificate-actions";
import type { CourseEnrollmentSummary } from "@/types/course";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RemoteImage } from "@/components/ui/remote-image";

export function MyCoursesPanel({ enrollments }: { enrollments: CourseEnrollmentSummary[] }) {
  if (!enrollments.length) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">My courses</p>
          <h2 className="mt-2 text-2xl font-semibold">No enrollments yet</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Browse the course library and enroll based on your plan limit. Progress and certificates appear here.
          </p>
        </div>
        <Button asChild>
          <Link href="/courses">
            <BookOpen className="mr-2 h-4 w-4" />
            Browse courses
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">My courses</p>
        <h2 className="mt-2 text-2xl font-semibold">Enrollments & progress</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Track completed lessons and download certificates when you finish a course.
        </p>
      </div>

      <div className="grid gap-4">
        {enrollments.map((enrollment) => {
          const remaining = Math.max(0, enrollment.lessonCount - enrollment.completedLessons);

          return (
            <Card key={enrollment.enrollmentId}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-lg bg-secondary sm:h-20 sm:w-36">
                  {enrollment.thumbnailUrl ? (
                    <RemoteImage
                      src={enrollment.thumbnailUrl}
                      alt={enrollment.title}
                      width={320}
                      height={180}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <PlayCircle className="h-8 w-8" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold">
                        <Link href={`/courses/${enrollment.slug}`} className="hover:text-primary">
                          {enrollment.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-muted-foreground">Instructor · {enrollment.instructorName}</p>
                    </div>
                    {enrollment.completed ? (
                      <Badge variant="verified">Completed</Badge>
                    ) : (
                      <Badge variant="secondary">In progress</Badge>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {enrollment.completedLessons} / {enrollment.lessonCount} lessons
                      </span>
                      <span className="text-muted-foreground">{enrollment.progressPercent}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${enrollment.progressPercent}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {remaining === 0 ? "All lessons completed" : `${remaining} lesson${remaining === 1 ? "" : "s"} remaining`}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <Link href={`/courses/${enrollment.slug}`}>Continue learning</Link>
                    </Button>
                    {enrollment.certificateReady ? (
                      <CertificateActions courseSlug={enrollment.slug} className="h-9 px-3 text-sm" />
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        <Award className="mr-2 h-4 w-4" />
                        Certificate locked
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
