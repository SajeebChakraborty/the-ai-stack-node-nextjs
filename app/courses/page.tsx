import type { Metadata } from "next";
import { CoursesCatalogClient } from "@/components/courses/courses-catalog-client";

export const metadata: Metadata = {
  title: "Courses",
  description: "Browse AI courses with video lessons, workbooks, and certificates on TheAiStack."
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function CoursesPage({ searchParams }: Props) {
  const { q } = await searchParams;

  return (
    <div className="section-shell">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Courses</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal md:text-5xl">Learn AI skills with structured video lessons.</h1>
        <p className="mt-4 text-muted-foreground">
          Browse collections, enroll with your plan, track lesson progress, and unlock certificates when you finish.
        </p>
      </div>
      <CoursesCatalogClient initialQuery={q ?? ""} />
    </div>
  );
}
