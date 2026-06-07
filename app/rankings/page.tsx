import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Flame, Sparkles, Star } from "lucide-react";
import { RankingsBoard, type RankingsBoardList } from "@/components/rankings/rankings-board";
import { RankingsHero } from "@/components/rankings/rankings-hero";
import { ScrollReveal, StaggerItem, StaggerReveal } from "@/components/home/scroll-reveal";
import { SectionShell } from "@/components/layout/section";
import { getRankingsBoard } from "@/lib/queries/rankings";
import { buildPageMetadata } from "@/lib/seo/build-metadata";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = buildPageMetadata({
  title: "AI Rankings",
  description:
    "Live AI tool rankings: trending in the last 24 hours, top rated by reviews, and fastest growing over the past 30 days.",
  path: "/rankings"
});

const formulaCards = [
  {
    title: "Trending — 24 hours",
    description:
      "Counts unique views, profile opens, and outbound clicks in the past 24 hours.",
    icon: Flame,
    color: "from-primary/15 to-primary/0"
  },
  {
    title: "Top rated — buyer reviews",
    description:
      "Bayesian average of verified buyer ratings, weighted by review count.",
    icon: Star,
    color: "from-amber-500/15 to-amber-500/0"
  },
  {
    title: "Fastest growing — 30 days",
    description:
      "Compares the last 30 days of traffic and conversions vs. the previous 30 days.",
    icon: Sparkles,
    color: "from-emerald-500/15 to-emerald-500/0"
  }
];

export default async function RankingsPage() {
  const board = await getRankingsBoard();

  const lists: RankingsBoardList[] = [
    {
      title: "Trending rankings",
      subtitle: "Top views · last 24 hours",
      icon: "flame",
      accent: "from-primary/15 via-primary/5 to-transparent",
      iconColor: "text-primary",
      iconRing: "ring-primary/25",
      tools: board.trending,
      metric: "views-24h",
      emptyMessage: "No live traffic yet. Verified listings appear here as soon as they get views."
    },
    {
      title: "Top-rated rankings",
      subtitle: "Sorted by buyer rating",
      icon: "star",
      accent: "from-amber-500/15 via-amber-500/5 to-transparent",
      iconColor: "text-amber-500",
      iconRing: "ring-amber-500/25",
      tools: board.topRated,
      metric: "rating",
      emptyMessage: "No rated listings yet. Rankings update when community reviews are submitted."
    },
    {
      title: "Fastest-growing rankings",
      subtitle: "Growth · last 30 days",
      icon: "sparkles",
      accent: "from-emerald-500/15 via-emerald-500/5 to-transparent",
      iconColor: "text-emerald-500",
      iconRing: "ring-emerald-500/25",
      tools: board.fastestGrowing,
      metric: "growth-30d",
      emptyMessage: "No growth signals yet. Traffic momentum over 30 days drives this list."
    }
  ];

  return (
    <div className="dark landing-root min-h-screen overflow-x-hidden">
      <SectionShell className="py-10 md:py-14">
        <RankingsHero />

        <RankingsBoard lists={lists} />

        <StaggerReveal className="mt-10 grid gap-4 md:grid-cols-3">
          {formulaCards.map((card) => {
            const Icon = card.icon;
            return (
              <StaggerItem key={card.title}>
                <div className="glow-card glow-card-hover group h-full overflow-hidden p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-primary shadow-[0_0_24px_-6px_hsl(var(--primary)/0.7)] transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold text-white">{card.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/60">{card.description}</p>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerReveal>

        <ScrollReveal direction="scale" className="mt-8">
          <div className="glow-card relative flex flex-col items-start justify-between gap-4 overflow-hidden p-6 sm:flex-row sm:items-center sm:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
            />
            <div className="relative">
              <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">
                Want to compare every tool side-by-side?
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-white/60">
                Explore the full directory with filters for pricing, category, and verification status.
              </p>
            </div>
            <Button asChild size="lg" className="relative shrink-0">
              <Link href="/directory">
                Explore directory
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </ScrollReveal>
      </SectionShell>
    </div>
  );
}
