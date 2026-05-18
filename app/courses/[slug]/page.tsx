import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { ensureCourseCatalogSeeded, getCourseDetailBySlug } from "@/lib/queries/courses";
import { buildPageMetadata } from "@/lib/seo/build-metadata";
import { courseJsonLd } from "@/lib/seo/schema";
import { CourseDetailClient } from "@/components/courses/course-detail-client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

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

  return buildPageMetadata({
    title: detail.course.title,
    description: detail.course.shortDescription,
    path: `/courses/${slug}`,
    image: detail.course.thumbnailUrl
  });
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
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd(detail.course)) }}
      />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/courses">Courses</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{detail.course.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <CourseDetailClient initialCourse={detail.course} />
    </div>
  );
}
