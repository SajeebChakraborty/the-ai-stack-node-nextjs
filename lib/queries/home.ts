import "server-only";

import { prisma } from "@/lib/db/prisma";
import { getCoursesPage, ensureCourseCatalogSeeded } from "@/lib/queries/courses";
import { getDirectoryToolsPage } from "@/lib/queries/directory";
import { getPublishedPremiumPlans } from "@/lib/queries/plans";

export async function getHomePageData() {
  await ensureCourseCatalogSeeded();

  const [
    publishedToolCount,
    publishedCourseCount,
    featuredCourses,
    trendingTools,
    recentReviews,
    plans,
    categories
  ] = await Promise.all([
    prisma.tool.count({ where: { status: "published" } }).catch(() => 0),
    prisma.course.count({ where: { status: "published" } }).catch(() => 0),
    getCoursesPage({ page: 1, pageSize: 6 }),
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
    prisma.category.findMany({ orderBy: { name: "asc" }, take: 8, select: { name: true, slug: true } }).catch(() => [])
  ]);

  return {
    stats: {
      toolCount: publishedToolCount,
      courseCount: publishedCourseCount,
      memberCount: 0
    },
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
    plans: plans.slice(0, 1),
    categories
  };
}
