import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export function buildPageMetadata(input: {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  noIndex?: boolean;
}): Metadata {
  const url = input.path ? `${baseUrl}${input.path.startsWith("/") ? input.path : `/${input.path}`}` : baseUrl;

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      type: "website",
      ...(input.image ? { images: [{ url: input.image }] } : {})
    },
    twitter: {
      card: input.image ? "summary_large_image" : "summary",
      title: input.title,
      description: input.description,
      ...(input.image ? { images: [input.image] } : {})
    },
    robots: input.noIndex ? { index: false, follow: false } : { index: true, follow: true }
  };
}

export function getSiteBaseUrl() {
  return baseUrl;
}
