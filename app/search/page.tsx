import type { Metadata } from "next";
import { DirectoryClient } from "@/components/directory/directory-client";
import { PageHeader } from "@/components/layout/page-header";
import { SectionShell } from "@/components/layout/section";
import { buildPageMetadata } from "@/lib/seo/build-metadata";
import { getDirectoryFilterOptions, getDirectoryToolsPage } from "@/lib/queries/directory";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim();
  const title = query ? `Search: ${query}` : "Advanced AI Search";
  const description = query
    ? `Search results for “${query}” on TheAiStack — tools ranked by reviews, trust, and pricing.`
    : "Search TheAiStack by product, category, pricing, review type, and trust score.";

  return buildPageMetadata({
    title,
    description,
    path: query ? `/search?q=${encodeURIComponent(query)}` : "/search"
  });
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const [initialPage, filters] = await Promise.all([
    getDirectoryToolsPage({ query, page: 1, pageSize: 12, sort: "trending" }),
    getDirectoryFilterOptions()
  ]);

  return (
    <SectionShell className="py-12 md:py-16">
      <PageHeader
        variant="marketing"
        eyebrow="Advanced search"
        title="Search the AI market by proof, not hype"
        className="mb-8"
      />
      <DirectoryClient
        initialQuery={query}
        initialData={{
          tools: initialPage.tools,
          total: initialPage.total,
          hasMore: initialPage.hasMore,
          filters
        }}
      />
    </SectionShell>
  );
}
