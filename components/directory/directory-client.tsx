"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Filter, Loader2, Search } from "lucide-react";
import type { DirectoryFilters } from "@/types/directory";
import { ToolCard } from "@/components/directory/tool-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Tool } from "@/types/domain";

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 220;

type DirectoryListPayload = {
  tools?: Tool[];
  filters?: DirectoryFilters;
  total?: number;
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
  pendingClaimToolIds?: string[];
};

type DirectoryInitialData = {
  tools: Tool[];
  total: number;
  hasMore: boolean;
  filters: DirectoryFilters;
};

export function DirectoryClient({
  initialCategory = "all",
  initialQuery = "",
  initialData
}: {
  initialCategory?: string;
  initialQuery?: string;
  initialData?: DirectoryInitialData;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [pricing, setPricing] = useState("all");
  const [sort, setSort] = useState<"trending" | "top-rated" | "fastest-growing" | "newest">("trending");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [tools, setTools] = useState<Tool[]>(initialData?.tools ?? []);
  const [total, setTotal] = useState(initialData?.total ?? 0);
  const [hasMore, setHasMore] = useState(initialData?.hasMore ?? false);
  const [pendingClaimToolIds, setPendingClaimToolIds] = useState<Set<string>>(() => new Set());
  const [filters, setFilters] = useState<DirectoryFilters>(
    initialData?.filters ?? { categories: [], pricingModels: [] }
  );
  const [loading, setLoading] = useState(!initialData);
  const [loadingMore, setLoadingMore] = useState(false);
  const fetchControllerRef = useRef<AbortController | null>(null);
  const skipInitialFetchRef = useRef(Boolean(initialData));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (initialData?.filters) {
      return;
    }
    void fetch("/api/directory?filtersOnly=true")
      .then((response) => response.json())
      .then((payload: { filters?: DirectoryFilters }) => {
        if (payload.filters) {
          setFilters(payload.filters);
        }
      })
      .catch(() => undefined);
  }, [initialData?.filters]);

  const loadDirectory = useCallback(
    async (targetPage: number, mode: "replace" | "append") => {
      fetchControllerRef.current?.abort();
      const controller = new AbortController();
      fetchControllerRef.current = controller;

      if (mode === "replace") {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const params = new URLSearchParams({
          category,
          pricing,
          sort,
          verified: String(verifiedOnly),
          page: String(targetPage),
          pageSize: String(PAGE_SIZE)
        });

        if (debouncedQuery) {
          params.set("q", debouncedQuery);
        }

        const response = await fetch(`/api/directory?${params.toString()}`, { signal: controller.signal });

        if (!response.ok) {
          throw new Error("directory-fetch-failed");
        }

        const payload = (await response.json()) as DirectoryListPayload;
        const nextTools = payload.tools ?? [];

        setTools((current) => (mode === "append" ? [...current, ...nextTools] : nextTools));
        setTotal(payload.total ?? nextTools.length);
        setHasMore(Boolean(payload.hasMore));
        setPage(payload.page ?? targetPage);
        setPendingClaimToolIds(new Set(payload.pendingClaimToolIds ?? []));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        if (mode === "replace") {
          setTools([]);
          setTotal(0);
          setHasMore(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [category, debouncedQuery, pricing, sort, verifiedOnly]
  );

  useEffect(() => {
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      return;
    }
    setPage(1);
    void loadDirectory(1, "replace");
  }, [loadDirectory]);

  const categoryOptions = useMemo(() => filters.categories, [filters.categories]);
  const pendingClaimSet = pendingClaimToolIds;

  function loadMore() {
    if (loadingMore || !hasMore) {
      return;
    }

    void loadDirectory(page + 1, "append");
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm backdrop-blur-sm sm:p-5">
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
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading directory listings...
            </>
          ) : (
            `${total} published listing${total === 1 ? "" : "s"} match your filters.`
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            pendingClaimRequest={pendingClaimSet.has(tool.id)}
          />
        ))}
      </div>

      {!loading && tools.length === 0 ? (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          No published listings match these filters. Verified founder claims appear here automatically after payment
          verification or admin approval.
        </div>
      ) : null}

      {hasMore ? (
        <Button variant="outline" className="mx-auto" disabled={loadingMore} onClick={loadMore}>
          {loadingMore ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Load more tools"
          )}
        </Button>
      ) : null}
    </div>
  );
}
