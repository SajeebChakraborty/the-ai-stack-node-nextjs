import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Medal, TrendingUp } from "lucide-react";
import { getRankingsBoard } from "@/lib/queries/rankings";
import { calculateRankingScore } from "@/lib/utils/ranking";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Tool } from "@/types/domain";

export const metadata: Metadata = {
  title: "AI Rankings",
  description: "Trending, top-rated, fastest-growing, and editor-picked AI tool rankings."
};

function RankingList({ emptyMessage, tools }: { emptyMessage: string; tools: Tool[] }) {
  if (!tools.length) {
    return <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {tools.map((tool, index) => (
        <Link key={tool.id} href={`/tools/${tool.slug}`} className="flex items-center justify-between rounded-md border p-3 hover:bg-secondary/50">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary font-semibold">{index + 1}</span>
            <div>
              <div className="font-medium">{tool.name}</div>
              <div className="text-xs text-muted-foreground">
                {tool.categories.length ? tool.categories.slice(0, 2).join(" · ") : "Uncategorized"}
              </div>
            </div>
          </div>
          <Badge variant={index === 0 ? "premium" : "secondary"}>
            <Medal className="mr-1 h-3 w-3" />
            {calculateRankingScore(tool)}
          </Badge>
        </Link>
      ))}
    </div>
  );
}

export default async function RankingsPage() {
  const board = await getRankingsBoard();
  const lists = [
    {
      title: "Trending rankings",
      tools: board.trending,
      emptyMessage: "No published listings yet. Verified founder claims appear here after approval."
    },
    {
      title: "Top-rated rankings",
      tools: board.topRated,
      emptyMessage: "No rated listings yet. Rankings update when community reviews are submitted."
    },
    {
      title: "Fastest-growing rankings",
      tools: board.fastestGrowing,
      emptyMessage: "No growth signals yet. Traffic and clicks in the last 7 days drive this list."
    }
  ] as const;

  return (
    <div className="section-shell">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Ranking engine</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal md:text-5xl">Rankings that reward trust, proof, and momentum.</h1>
        <p className="mt-4 text-muted-foreground">
          Live rankings from published directory listings, refreshed from reviews, trust signals, and real traffic analytics.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {lists.map((list) => (
          <Card key={list.title}>
            <CardContent className="p-5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold">{list.title}</h2>
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <RankingList tools={list.tools} emptyMessage={list.emptyMessage} />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-8 rounded-lg border bg-secondary/30 p-6">
        <h2 className="text-2xl font-semibold">How ranking scores are calculated</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          The engine weighs review quality, rating confidence, trust score, social proof, verified creator reputation, traffic quality, conversion signals, recency, and growth velocity.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/directory">
            Explore full directory
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
