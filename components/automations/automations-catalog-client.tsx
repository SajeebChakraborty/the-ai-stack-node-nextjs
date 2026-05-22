"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Clock, Loader2, Search, ShieldCheck, Workflow } from "lucide-react";
import type { AutomationListItem } from "@/lib/queries/automations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RemoteImage } from "@/components/ui/remote-image";

type AutomationsInitialData = {
  automations: AutomationListItem[];
  total: number;
  hasMore: boolean;
};

export function AutomationsCatalogClient({
  initialQuery = "",
  initialData
}: {
  initialQuery?: string;
  initialData?: AutomationsInitialData;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [automations, setAutomations] = useState<AutomationListItem[]>(initialData?.automations ?? []);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialData?.hasMore ?? false);
  const [total, setTotal] = useState(initialData?.total ?? 0);
  const [loading, setLoading] = useState(!initialData);
  const [loadingMore, setLoadingMore] = useState(false);
  const fetchRef = useRef<AbortController | null>(null);
  const skipInitialFetchRef = useRef(Boolean(initialData));

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 220);
    return () => window.clearTimeout(timer);
  }, [query]);

  const load = useCallback(
    async (targetPage: number, mode: "replace" | "append") => {
      fetchRef.current?.abort();
      const controller = new AbortController();
      fetchRef.current = controller;

      if (mode === "replace") setLoading(true);
      else setLoadingMore(true);

      try {
        const params = new URLSearchParams({ page: String(targetPage), pageSize: "12" });
        if (debouncedQuery) params.set("q", debouncedQuery);

        const response = await fetch(`/api/automations?${params.toString()}`, { signal: controller.signal });
        const payload = (await response.json()) as {
          automations?: AutomationListItem[];
          total?: number;
          hasMore?: boolean;
        };

        setAutomations((current) =>
          mode === "append" ? [...current, ...(payload.automations ?? [])] : payload.automations ?? []
        );
        setTotal(payload.total ?? 0);
        setHasMore(Boolean(payload.hasMore));
        setPage(targetPage);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (mode === "replace") {
          setAutomations([]);
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
    [debouncedQuery]
  );

  useEffect(() => {
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      return;
    }
    void load(1, "replace");
  }, [load]);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1.4fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search automations..."
              className="pl-9"
            />
          </div>
          <p className="flex items-center text-sm text-muted-foreground">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {total} automation{total === 1 ? "" : "s"}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1">
            <ShieldCheck className="h-3.5 w-3.5" /> Escrow protected
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1">
            <Workflow className="h-3.5 w-3.5" /> Workflow included
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1">
            <Clock className="h-3.5 w-3.5" /> Setup by creator
          </span>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {automations.map((automation) => (
          <Card key={automation.id} className="overflow-hidden transition hover:-translate-y-0.5 hover:shadow-glow">
            <div className="relative aspect-video bg-secondary">
              {automation.thumbnailUrl ? (
                <RemoteImage
                  src={automation.thumbnailUrl}
                  alt={automation.title}
                  width={640}
                  height={360}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Workflow className="h-10 w-10" />
                </div>
              )}
              {automation.featured ? (
                <Badge className="absolute left-3 top-3" variant="premium">
                  Featured
                </Badge>
              ) : null}
              <Badge className="absolute right-3 bottom-3" variant={automation.priceCents > 0 ? "premium" : "secondary"}>
                {automation.priceCents > 0 ? `$${(automation.priceCents / 100).toFixed(2)}` : "Free"}
              </Badge>
            </div>
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap gap-2">
                {automation.toolingTags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              <h2 className="text-lg font-semibold leading-snug">
                <Link href={`/automations/${automation.slug}`} className="hover:text-primary">
                  {automation.title}
                </Link>
              </h2>
              <p className="line-clamp-2 text-sm text-muted-foreground">{automation.shortDescription}</p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  ~{automation.setupMinutes} min setup
                </span>
                <span>By {automation.ownerName}</span>
              </div>
              <Button asChild size="sm" className="w-full">
                <Link href={`/automations/${automation.slug}`}>
                  {automation.priceCents > 0
                    ? `Buy for $${(automation.priceCents / 100).toFixed(2)}`
                    : "View automation"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && automations.length === 0 ? (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          No automations available yet. Be the first to publish one from your dashboard!
        </div>
      ) : null}

      {hasMore ? (
        <Button variant="outline" className="mx-auto" disabled={loadingMore} onClick={() => void load(page + 1, "append")}>
          {loadingMore ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Load more automations"
          )}
        </Button>
      ) : null}
    </div>
  );
}
