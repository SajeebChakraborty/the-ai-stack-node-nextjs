import type { Metadata } from "next";
import { AutomationsCatalogClient } from "@/components/automations/automations-catalog-client";
import { ImmersivePageHero } from "@/components/layout/immersive-page-hero";
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
    <div className="dark landing-root min-h-screen overflow-x-hidden">
      <SectionShell className="py-10 md:py-14">
        <ImmersivePageHero
          eyebrow="Automations"
          title="Buy AI automations with"
          accent="hands-on setup"
          description="Every automation ships with a workflow file and the creator installs it on your machine. Funds are held in escrow until you confirm everything works."
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
    </div>
  );
}
