import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCommunityBlockedReason } from "@/lib/auth/community-access";
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
  const previewImage = tool.screenshots[0];
  return {
    title: `${tool.name} Reviews, Pricing, Alternatives, and Founder Updates`,
    description: tool.description,
    alternates: {
      canonical: `/tools/${tool.slug}`
    },
    openGraph: {
      title: `${tool.name} on TheAiStack`,
      description: tool.tagline,
      ...(previewImage ? { images: [previewImage] } : {})
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.name} reviews and alternatives`,
      description: tool.tagline,
      ...(previewImage ? { images: [previewImage] } : {})
    }
  };
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const [pageData, currentUser] = await Promise.all([getToolPageData(slug), getCurrentUser()]);
  if (!pageData) notFound();

  const tool = pageData.tool;
  const communityBlockedReason = getCommunityBlockedReason({
    currentUser,
    listingFounderId: tool.founderId
  });

  return (
    <ToolProfile
      alternatives={pageData.alternatives}
      communityBlockedReason={communityBlockedReason}
      discussions={pageData.discussions}
      tool={tool}
      toolReviews={pageData.toolReviews}
      updates={pageData.updates}
    />
  );
}
