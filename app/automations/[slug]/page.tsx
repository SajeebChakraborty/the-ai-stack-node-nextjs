import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AutomationDetailClient } from "@/components/automations/automation-detail-client";
import { SectionShell } from "@/components/layout/section";
import { buildPageMetadata } from "@/lib/seo/build-metadata";
import { getAutomationDetail } from "@/lib/queries/automations";
import { getCurrentUser } from "@/lib/auth/session";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const automation = await getAutomationDetail(slug);
  if (!automation) {
    return buildPageMetadata({
      title: "Automation not found",
      description: "We couldn't find that automation.",
      path: `/automations/${slug}`,
      noIndex: true
    });
  }
  return buildPageMetadata({
    title: automation.title,
    description: automation.shortDescription,
    path: `/automations/${automation.slug}`,
    image: automation.thumbnailUrl ?? undefined
  });
}

export default async function AutomationDetailPage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const automation = await getAutomationDetail(slug, user?.id);
  if (!automation) notFound();

  return (
    <SectionShell className="py-12 md:py-16">
      <AutomationDetailClient
        automation={automation}
        currentUserId={user?.id ?? null}
      />
    </SectionShell>
  );
}
