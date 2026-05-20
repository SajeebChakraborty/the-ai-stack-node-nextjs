import "server-only";

import { prisma } from "@/lib/db/prisma";
import { getCoursesPage, ensureCourseCatalogSeeded } from "@/lib/queries/courses";
import { getDirectoryToolsPage } from "@/lib/queries/directory";
import { getPublishedPremiumPlans } from "@/lib/queries/plans";
import { formatDurationMinutes } from "@/lib/courses/utils";
import type { CourseListItem } from "@/types/course";

export async function getHomePageData() {
  await ensureCourseCatalogSeeded();

  const [
    publishedToolCount,
    publishedCourseCount,
    featuredCourses,
    trendingTools,
    recentReviews,
    plans,
    spotlightRow
  ] = await Promise.all([
    prisma.tool.count({ where: { status: "published" } }).catch(() => 0),
    prisma.course.count({ where: { status: "published" } }).catch(() => 0),
    getCoursesPage({ page: 1, pageSize: 8 }),
    getDirectoryToolsPage({ sort: "trending", page: 1, pageSize: 6 }),
    prisma.review
      .findMany({
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          rating: true,
          title: true,
          body: true,
          tool: { select: { name: true, slug: true } },
          author: { select: { fullName: true } }
        }
      })
      .catch(() => []),
    getPublishedPremiumPlans().catch(() => []),
    prisma.course
      .findFirst({
        where: {
          status: "published",
          OR: [{ featured: true }, { promoVideoUrl: { not: null } }]
        },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
        select: {
          id: true,
          slug: true,
          title: true,
          shortDescription: true,
          thumbnailUrl: true,
          promoVideoUrl: true,
          level: true,
          durationMinutes: true,
          lessonCount: true,
          defaultRating: true,
          defaultReviewCount: true,
          instructorName: true,
          featured: true,
          releasedAt: true,
          categories: { include: { category: { select: { name: true } } } }
        }
      })
      .catch(() => null)
  ]);

  const spotlightCourse: CourseListItem | null = spotlightRow
    ? {
        id: spotlightRow.id,
        slug: spotlightRow.slug,
        title: spotlightRow.title,
        shortDescription: spotlightRow.shortDescription,
        thumbnailUrl: spotlightRow.thumbnailUrl,
        promoVideoUrl: spotlightRow.promoVideoUrl,
        level: spotlightRow.level as CourseListItem["level"],
        durationMinutes: spotlightRow.durationMinutes,
        durationLabel: formatDurationMinutes(spotlightRow.durationMinutes),
        lessonCount: spotlightRow.lessonCount,
        rating: Number(spotlightRow.defaultRating),
        reviewCount: spotlightRow.defaultReviewCount,
        instructorName: spotlightRow.instructorName,
        categories: spotlightRow.categories.map((c) => c.category.name),
        featured: spotlightRow.featured,
        releasedLabel: spotlightRow.releasedAt
          ? new Date(spotlightRow.releasedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
          : null
      }
    : featuredCourses.courses[0] ?? null;

  return {
    stats: {
      toolCount: publishedToolCount,
      courseCount: publishedCourseCount,
      memberCount: 0
    },
    spotlightCourse,
    featuredCourses: featuredCourses.courses,
    trendingTools: trendingTools.tools,
    recentReviews: recentReviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      body: review.body,
      toolName: review.tool.name,
      toolSlug: review.tool.slug,
      authorName: review.author?.fullName ?? "Verified reviewer"
    })),
    plans: plans.slice(0, 1)
  };
}
