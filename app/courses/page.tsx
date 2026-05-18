import type { Metadata } from "next";
import { CoursesCatalogClient } from "@/components/courses/courses-catalog-client";
import { PageHeader } from "@/components/layout/page-header";
import { SectionShell } from "@/components/layout/section";
import { buildPageMetadata } from "@/lib/seo/build-metadata";
import { ensureCourseCatalogSeeded, getCoursesPage, listCourseCategories } from "@/lib/queries/courses";

export const metadata: Metadata = buildPageMetadata({
  title: "Courses",
  description: "Browse AI courses with video lessons, workbooks, and certificates on TheAiStack.",
  path: "/courses"
});

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function CoursesPage({ searchParams }: Props) {
  await ensureCourseCatalogSeeded();
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const [initialPage, categories] = await Promise.all([
    getCoursesPage({ query, page: 1, pageSize: 12 }),
    listCourseCategories()
  ]);

  return (
    <SectionShell className="py-12 md:py-16">
      <PageHeader
        variant="academy"
        eyebrow="Courses"
        title="Learn AI skills with structured video lessons"
        description="Browse collections, enroll with your plan, track lesson progress, and unlock certificates when you finish."
        className="mb-8"
      />
      <CoursesCatalogClient
        initialQuery={query}
        initialCategories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        initialData={{
          courses: initialPage.courses,
          total: initialPage.total,
          hasMore: initialPage.hasMore
        }}
      />
    </SectionShell>
  );
}
