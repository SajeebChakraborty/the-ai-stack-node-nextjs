import type { Metadata } from "next";
import { DirectoryClient } from "@/components/directory/directory-client";

export const metadata: Metadata = {
  title: "Advanced AI Search",
  description: "Search TheAiStack by product, category, pricing, review type, creator proof, founder activity, and trust score."
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;

  return (
    <div className="section-shell">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Advanced search</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal md:text-5xl">Search the AI market by proof, not hype.</h1>
      </div>
      <DirectoryClient initialQuery={q ?? ""} />
    </div>
  );
}
