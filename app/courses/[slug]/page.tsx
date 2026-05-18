import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { ensureCourseCatalogSeeded, getCourseDetailBySlug } from "@/lib/queries/courses";
import { CourseDetailClient } from "@/components/courses/course-detail-client";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  await ensureCourseCatalogSeeded();
  const detail = await getCourseDetailBySlug(slug);
  if (!detail) {
    return { title: "Course not found" };
  }

  return {
    title: detail.course.title,
    description: detail.course.shortDescription
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  await ensureCourseCatalogSeeded();

  const user = await getCurrentUser();
  const detail = await getCourseDetailBySlug(slug, user?.id ?? null);
  if (!detail) {
    notFound();
  }

  return (
    <div className="section-shell space-y-6">
      <Link href="/courses" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" />
        All courses
      </Link>
      <CourseDetailClient initialCourse={detail.course} />
    </div>
  );
}
