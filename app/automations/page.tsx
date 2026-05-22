import type { Metadata } from "next";
import { AutomationsCatalogClient } from "@/components/automations/automations-catalog-client";
import { PageHeader } from "@/components/layout/page-header";
import { SectionShell } from "@/components/layout/section";
import { buildPageMetadata } from "@/lib/seo/build-metadata";
import { getAutomationsPage } from "@/lib/queries/automations";

export const metadata: Metadata = buildPageMetadata({
  title: "Automations",
  description: "Buy ready-to-deploy AI automations from creators. Setup included, escrow protected.",
  path: "/automations"
});

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AutomationsPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const initial = await getAutomationsPage({ query, page: 1, pageSize: 12 });

  return (
    <SectionShell className="py-12 md:py-16">
      <PageHeader
        variant="academy"
        eyebrow="Automations"
        title="Buy AI automations with hands-on setup"
        description="Every automation ships with a workflow file and the creator installs it on your machine. Funds are held in escrow until you confirm everything works."
        className="mb-8"
      />
      <AutomationsCatalogClient
        initialQuery={query}
        initialData={{
          automations: initial.automations,
          total: initial.total,
          hasMore: initial.hasMore
        }}
      />
    </SectionShell>
  );
}
