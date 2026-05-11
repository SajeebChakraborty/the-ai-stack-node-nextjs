import type { Metadata } from "next";
import { DirectoryClient } from "@/components/directory/directory-client";

export const metadata: Metadata = {
  title: "AI Tool Directory",
  description: "Search, filter, and rank verified AI tools by reviews, trust, pricing, category, and momentum."
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function DirectoryPage({ searchParams }: Props) {
  const { q } = await searchParams;

  return (
    <div className="section-shell">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Directory</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal md:text-5xl">Find the right AI tool with buyer-grade proof.</h1>
        <p className="mt-4 text-muted-foreground">
          Live search, advanced filters, pricing segments, verification status, and ranking signals tuned for serious software evaluation.
        </p>
      </div>
      <DirectoryClient initialQuery={q ?? ""} />
    </div>
  );
}
