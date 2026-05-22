"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserDashboardNav } from "@/lib/dashboard/nav-context";

type CreatedCourse = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  status: "draft" | "published" | "archived";
  priceCents: number;
  currency: string;
  thumbnailUrl: string | null;
  enrollmentCount: number;
  purchaseCount: number;
  lessonCount: number;
  sectionCount: number;
  updatedAt: string;
  createdAt: string;
};

function formatPrice(cents: number, currency: string) {
  if (cents <= 0) return "Free";
  const amount = (cents / 100).toFixed(2);
  if (currency === "usd") return `$${amount}`;
  return `${amount} ${currency.toUpperCase()}`;
}

export function MyCreatedCoursesPanel() {
  const nav = useUserDashboardNav();
  const [courses, setCourses] = useState<CreatedCourse[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function refresh() {
    try {
      const response = await fetch("/api/user/courses");
      if (!response.ok) {
        setCourses([]);
        return;
      }
      const data = (await response.json()) as { courses?: CreatedCourse[] };
      setCourses(data.courses ?? []);
    } catch {
      setCourses([]);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function deleteCourse(course: CreatedCourse) {
    const confirmed = window.confirm(
      course.purchaseCount > 0
        ? `${course.title} has paid buyers and will be archived (hidden from /courses) instead of deleted. Continue?`
        : `Delete ${course.title}? This cannot be undone.`
    );
    if (!confirmed) return;

    setBusyId(course.id);
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/user/courses/${course.id}`, { method: "DELETE" });
      const data = (await response.json()) as { archived?: boolean; deleted?: boolean; error?: string };

      if (!response.ok) {
        setStatusMessage(data.error ?? "Could not remove course.");
      } else {
        setStatusMessage(data.archived ? "Course archived (buyers retain access)." : "Course deleted.");
        await refresh();
      }
    } catch {
      setStatusMessage("Network error.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/60 pb-5">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Your courses</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Courses you&apos;ve published</h2>
          <p className="mt-2 text-sm text-muted-foreground">Track sales, edit content, or launch a new course.</p>
        </div>
        <Button onClick={() => nav?.setView("create-course")}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create new course
        </Button>
      </div>

      {statusMessage ? <p className="text-sm text-muted-foreground">{statusMessage}</p> : null}

      {courses === null ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your courses...
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-lg font-medium">No courses yet</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Publish your first paid (or free) course in minutes. Buyers can pay via Stripe and your earnings land in
              your wallet automatically.
            </p>
            <Button onClick={() => nav?.setView("create-course")}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create your first course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{course.title}</CardTitle>
                  <p className="line-clamp-2 max-w-2xl text-sm text-muted-foreground">{course.shortDescription}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge variant={course.status === "published" ? "verified" : "secondary"}>{course.status}</Badge>
                    <Badge variant="outline">{formatPrice(course.priceCents, course.currency)}</Badge>
                    <Badge variant="outline">{course.lessonCount} lessons</Badge>
                    <Badge variant="outline">{course.purchaseCount} purchases</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/courses/${course.slug}`} target="_blank">
                      <ExternalLink className="mr-2 h-4 w-4" /> View
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <Pencil className="mr-2 h-4 w-4" /> Edit (coming soon)
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busyId === course.id}
                    onClick={() => deleteCourse(course)}
                  >
                    {busyId === course.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    {course.purchaseCount > 0 ? "Archive" : "Delete"}
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
