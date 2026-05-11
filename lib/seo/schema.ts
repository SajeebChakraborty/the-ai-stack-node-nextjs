import type { Tool } from "@/types/domain";

export function toolJsonLd(tool: Tool) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    applicationCategory: tool.categories.join(", "),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: tool.rating,
      reviewCount: tool.reviewCount
    },
    offers: {
      "@type": "Offer",
      price: tool.startingPrice,
      priceCurrency: "USD",
      url: tool.affiliateUrl
    },
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/tools/${tool.slug}`,
    description: tool.description
  };
}
