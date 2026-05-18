import type { MetadataRoute } from "next";
import { getSiteBaseUrl } from "@/lib/seo/build-metadata";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/user", "/account", "/auth", "/founder", "/creator/dashboard", "/api"]
    },
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
