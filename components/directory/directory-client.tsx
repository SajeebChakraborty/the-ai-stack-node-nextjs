"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Filter, Loader2, Search } from "lucide-react";
import type { DirectoryFilters } from "@/types/directory";
import { ToolCard } from "@/components/directory/tool-card";
import { DirectoryPagination } from "@/components/directory/directory-pagination";
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
  const [pendingClaimToolIds, setPendingClaimToolIds] = useState<Set<string>>(() => new Set());
  const [filters, setFilters] = useState<DirectoryFilters>(
    initialData?.filters ?? { categories: [], pricingModels: [] }
  );
  const [loading, setLoading] = useState(!initialData);
  const fetchControllerRef = useRef<AbortController | null>(null);
  const skipInitialFetchRef = useRef(Boolean(initialData));
  const gridRef = useRef<HTMLDivElement | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
    async (targetPage: number) => {
      fetchControllerRef.current?.abort();
      const controller = new AbortController();
      fetchControllerRef.current = controller;

      setLoading(true);

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

        setTools(nextTools);
        setTotal(payload.total ?? nextTools.length);
        setPage(payload.page ?? targetPage);
        setPendingClaimToolIds(new Set(payload.pendingClaimToolIds ?? []));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setTools([]);
        setTotal(0);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [category, debouncedQuery, pricing, sort, verifiedOnly]
  );

  /** Refetch from page 1 when filters/sort/search change. */
  useEffect(() => {
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      return;
    }
    setPage(1);
    void loadDirectory(1);
  }, [loadDirectory]);

  const categoryOptions = useMemo(() => filters.categories, [filters.categories]);
  const pendingClaimSet = pendingClaimToolIds;

  function handlePageChange(target: number) {
    setPage(target);
    void loadDirectory(target);
    if (gridRef.current) {
      const top = gridRef.current.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }

  const startIndex = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(total, page * PAGE_SIZE);

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
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading directory listings...
            </>
          ) : total === 0 ? (
            "No published listings match your filters."
          ) : (
            <>
              Showing <span className="font-medium text-foreground">{startIndex}–{endIndex}</span>{" "}
              of <span className="font-medium text-foreground">{total}</span> listing
              {total === 1 ? "" : "s"} · Page {page} of {totalPages}
            </>
          )}
        </div>
      </div>

      <div ref={gridRef} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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

      <DirectoryPagination
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        disabled={loading}
      />
    </div>
  );
}
