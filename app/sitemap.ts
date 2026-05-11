import type { MetadataRoute } from "next";
import { categories, tools } from "@/data/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const staticRoutes = ["", "/directory", "/rankings", "/pricing", "/search", "/creator/dashboard", "/founder/dashboard"];

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: route === "" ? 1 : 0.8
    })),
    ...tools.map((tool) => ({
      url: `${baseUrl}/tools/${tool.slug}`,
      lastModified: new Date(tool.launchedAt),
      changeFrequency: "weekly" as const,
      priority: 0.9
    })),
    ...categories.map((category) => ({
      url: `${baseUrl}/categories/${category.toLowerCase()}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.75
    }))
  ];
}
