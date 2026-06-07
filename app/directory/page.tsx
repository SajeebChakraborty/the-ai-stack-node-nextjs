import type { Metadata } from "next";
import { DirectoryClient } from "@/components/directory/directory-client";
import { ImmersivePageHero } from "@/components/layout/immersive-page-hero";
import { SectionShell } from "@/components/layout/section";
import { buildPageMetadata } from "@/lib/seo/build-metadata";
import { getDirectoryFilterOptions, getDirectoryToolsPage } from "@/lib/queries/directory";

export const metadata: Metadata = buildPageMetadata({
  title: "AI Tool Directory",
  description: "Search, filter, and rank verified AI tools by reviews, trust, pricing, category, and momentum.",
  path: "/directory"
});

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function DirectoryPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const [initialPage, filters] = await Promise.all([
    getDirectoryToolsPage({ query, page: 1, pageSize: 12, sort: "trending" }),
    getDirectoryFilterOptions()
  ]);

  return (
    <div className="dark landing-root min-h-screen overflow-x-hidden">
      <SectionShell className="py-10 md:py-14">
        <ImmersivePageHero
          eyebrow="Directory"
          title="Find the right AI tool with"
          accent="buyer-grade proof"
          description="Live search, advanced filters, pricing segments, verification status, and ranking signals tuned for serious software evaluation."
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
    </div>
  );
}
