import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categories } from "@/data/catalog";
import { DirectoryClient } from "@/components/directory/directory-client";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((item) => item.toLowerCase() === slug.toLowerCase());
  if (!category) return {};
  return {
    title: `Best ${category} AI Tools`,
    description: `Compare top-rated ${category} AI tools by reviews, pricing, trust score, launches, and creator proof.`
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = categories.find((item) => item.toLowerCase() === slug.toLowerCase());
  if (!category) notFound();

  return (
    <div className="section-shell">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Programmatic SEO</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal md:text-5xl">Best {category} AI tools in 2026</h1>
        <p className="mt-4 text-muted-foreground">
          Ranked by verified reviews, social credibility, growth momentum, pricing transparency, and editorial evaluation.
        </p>
      </div>
      <DirectoryClient initialCategory={category.toLowerCase()} />
    </div>
  );
}
