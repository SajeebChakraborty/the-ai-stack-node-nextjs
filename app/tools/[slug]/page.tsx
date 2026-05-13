import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getToolBySlug, getToolPageData } from "@/lib/queries/tools";
import { ToolProfile } from "@/components/tool/tool-profile";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) return {};
  return {
    title: `${tool.name} Reviews, Pricing, Alternatives, and Founder Updates`,
    description: tool.description,
    alternates: {
      canonical: `/tools/${tool.slug}`
    },
    openGraph: {
      title: `${tool.name} on TheAiStack`,
      description: tool.tagline,
      images: [tool.screenshots[0]]
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.name} reviews and alternatives`,
      description: tool.tagline,
      images: [tool.screenshots[0]]
    }
  };
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const [pageData, currentUser] = await Promise.all([getToolPageData(slug), getCurrentUser()]);
  if (!pageData) notFound();

  const tool = pageData.tool;
  const isOwner = Boolean(currentUser && tool.founderId && currentUser.id === tool.founderId);
  const canCommunityInteract = Boolean(currentUser && !isOwner && ["user", "founder", "admin"].includes(currentUser.role));
  const communityHelperText = currentUser
    ? isOwner
      ? "Community reviews and votes must come from users or other founders, not the claiming founder."
      : undefined
    : "Sign in as a user or another founder to review this tool and vote in discussions.";

  return (
    <ToolProfile
      alternatives={pageData.alternatives}
      canCommunityInteract={canCommunityInteract}
      communityHelperText={communityHelperText}
      discussions={pageData.discussions}
      tool={tool}
      toolReviews={pageData.toolReviews}
      updates={pageData.updates}
    />
  );
}
