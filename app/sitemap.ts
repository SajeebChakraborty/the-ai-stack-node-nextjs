import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";
import { ensureCourseCatalogSeeded } from "@/lib/queries/courses";
import { getSiteBaseUrl } from "@/lib/seo/build-metadata";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteBaseUrl();
  await ensureCourseCatalogSeeded();

  const staticRoutes = ["", "/directory", "/courses", "/rankings", "/pricing", "/search"];

  let tools: Array<{ slug: string; updatedAt: Date }> = [];
  let courses: Array<{ slug: string; updatedAt: Date }> = [];
  let categories: Array<{ slug: string; updatedAt: Date }> = [];

  try {
    [tools, courses, categories] = await Promise.all([
      prisma.tool.findMany({
        where: { status: "published" },
        select: { slug: true, updatedAt: true }
      }),
      prisma.course.findMany({
        where: { status: "published" },
        select: { slug: true, updatedAt: true }
      }),
      prisma.category.findMany({
        select: { slug: true, updatedAt: true }
      })
    ]);
  } catch {
    // database unavailable during build
  }

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: route === "" ? 1 : 0.8
    })),
    ...tools.map((tool) => ({
      url: `${baseUrl}/tools/${tool.slug}`,
      lastModified: tool.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9
    })),
    ...courses.map((course) => ({
      url: `${baseUrl}/courses/${course.slug}`,
      lastModified: course.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.85
    })),
    ...categories.map((category) => ({
      url: `${baseUrl}/categories/${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.75
    }))
  ];
}
