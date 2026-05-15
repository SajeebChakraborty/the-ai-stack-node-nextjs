"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import type { Tool } from "@/types/domain";
import { ToolCard } from "@/components/directory/tool-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type DirectoryFilters = {
  categories: Array<{ slug: string; name: string }>;
  pricingModels: string[];
};

export function DirectoryClient({ initialCategory = "all", initialQuery = "" }: { initialCategory?: string; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [pricing, setPricing] = useState("all");
  const [sort, setSort] = useState<"trending" | "top-rated" | "fastest-growing" | "newest">("trending");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(9);
  const [tools, setTools] = useState<Tool[]>([]);
  const [filters, setFilters] = useState<DirectoryFilters>({ categories: [], pricingModels: [] });
  const [loading, setLoading] = useState(true);

  const loadDirectory = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        category,
        pricing,
        sort,
        verified: String(verifiedOnly)
      });

      if (query.trim()) {
        params.set("q", query.trim());
      }

      const response = await fetch(`/api/directory?${params.toString()}`);
      const payload = (await response.json()) as {
        tools?: Tool[];
        filters?: DirectoryFilters;
        total?: number;
      };

      setTools(payload.tools ?? []);
      if (payload.filters) {
        setFilters(payload.filters);
      }
    } catch {
      setTools([]);
    } finally {
      setLoading(false);
    }
  }, [category, pricing, query, sort, verifiedOnly]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDirectory();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [loadDirectory]);

  useEffect(() => {
    setVisibleCount(9);
  }, [category, pricing, query, sort, verifiedOnly]);

  const categoryOptions = useMemo(() => filters.categories, [filters.categories]);

  return (
    <div className="grid gap-6">
      <div className="rounded-xl border border-border bg-card p-4 shadow-md dark:bg-[hsl(0,0%,8%)]">
        <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search AI tools, use cases, founders..."
              className="border-border/80 bg-background pl-9 shadow-sm"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="border-border/80 bg-background shadow-sm">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categoryOptions.map((item) => (
                <SelectItem key={item.slug} value={item.slug}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={pricing} onValueChange={setPricing}>
            <SelectTrigger className="border-border/80 bg-background shadow-sm">
              <SelectValue placeholder="Pricing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All pricing</SelectItem>
              {filters.pricingModels.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(value) => setSort(value as typeof sort)}>
            <SelectTrigger className="border-border/80 bg-background shadow-sm">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trending">Trending</SelectItem>
              <SelectItem value="top-rated">Top rated</SelectItem>
              <SelectItem value="fastest-growing">Fastest growing</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex h-10 items-center gap-2 rounded-md border border-border/80 bg-background px-3 text-sm shadow-sm">
            <Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
            Verified
          </label>
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          {loading ? "Loading directory listings..." : `${tools.length} published listing${tools.length === 1 ? "" : "s"} match your filters.`}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tools.slice(0, visibleCount).map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>

      {!loading && tools.length === 0 ? (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          No published listings match these filters. Verified founder claims appear here automatically after payment verification or admin approval.
        </div>
      ) : null}

      {visibleCount < tools.length ? (
        <Button variant="outline" className="mx-auto" onClick={() => setVisibleCount((value) => value + 9)}>
          Load more tools
        </Button>
      ) : null}
    </div>
  );
}
