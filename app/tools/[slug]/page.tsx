import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAlternatives, getToolBySlug, getToolReviews } from "@/lib/queries/tools";
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
  const tool = await getToolBySlug(slug);
  if (!tool) notFound();

  const [toolReviews, alternatives] = await Promise.all([getToolReviews(slug), getAlternatives(slug)]);

  return <ToolProfile tool={tool} toolReviews={toolReviews} alternatives={alternatives} />;
}
