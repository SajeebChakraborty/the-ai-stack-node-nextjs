"use client";

import { useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { categories, tools } from "@/data/catalog";
import { sortTools } from "@/lib/utils/ranking";
import { ToolCard } from "@/components/directory/tool-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export function DirectoryClient({ initialCategory = "all", initialQuery = "" }: { initialCategory?: string; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [pricing, setPricing] = useState("all");
  const [sort, setSort] = useState<"trending" | "top-rated" | "fastest-growing" | "newest">("trending");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(9);

  const filteredTools = useMemo(() => {
    const q = query.toLowerCase().trim();
    const result = tools.filter((tool) => {
      const matchesQuery = !q || [tool.name, tool.tagline, tool.description, ...tool.features, ...tool.categories].join(" ").toLowerCase().includes(q);
      const matchesCategory = category === "all" || tool.categories.some((value) => value.toLowerCase() === category.toLowerCase());
      const matchesPricing = pricing === "all" || tool.pricingModel === pricing;
      const matchesVerified = !verifiedOnly || tool.verified;
      return matchesQuery && matchesCategory && matchesPricing && matchesVerified;
    });
    return sortTools(result, sort);
  }, [category, pricing, query, sort, verifiedOnly]);

  return (
    <div className="grid gap-6">
      <div className="minimal-surface rounded-lg p-4">
        <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search AI tools, use cases, founders..." className="pl-9" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((item) => (
                <SelectItem key={item} value={item.toLowerCase()}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={pricing} onValueChange={setPricing}>
            <SelectTrigger>
              <SelectValue placeholder="Pricing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All pricing</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="freemium">Freemium</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="usage-based">Usage based</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(value) => setSort(value as typeof sort)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trending">Trending</SelectItem>
              <SelectItem value="top-rated">Top rated</SelectItem>
              <SelectItem value="fastest-growing">Fastest growing</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm">
            <Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
            Verified
          </label>
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          {filteredTools.length} tools match your ranking and trust filters.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredTools.slice(0, visibleCount).map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>

      {visibleCount < filteredTools.length ? (
        <Button variant="outline" className="mx-auto" onClick={() => setVisibleCount((value) => value + 9)}>
          Load more tools
        </Button>
      ) : null}
    </div>
  );
}
