import type { Tool } from "@/types/domain";
import type { CourseDetail } from "@/types/course";
import { getSiteBaseUrl } from "@/lib/seo/build-metadata";

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
    url: `${getSiteBaseUrl()}/tools/${tool.slug}`,
    description: tool.description
  };
}

export function courseJsonLd(course: CourseDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.shortDescription,
    provider: {
      "@type": "Organization",
      name: "TheAiStack"
    },
    url: `${getSiteBaseUrl()}/courses/${course.slug}`,
    ...(course.thumbnailUrl ? { image: course.thumbnailUrl } : {}),
    offers: {
      "@type": "Offer",
      category: "Membership",
      price: 0,
      priceCurrency: "USD"
    }
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  const base = getSiteBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${base}${item.path}`
    }))
  };
}

export function organizationJsonLd() {
  const base = getSiteBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TheAiStack",
    url: base,
    description: "AI tool directory, courses, reviews, and certificates."
  };
}

export function faqJsonLd(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}
