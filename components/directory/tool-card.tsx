"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Bookmark, CheckCircle2, ExternalLink, Handshake, Star, TrendingUp } from "lucide-react";
import { ClaimRequestDialog } from "@/components/directory/claim-request-dialog";
import { showInfoAlert } from "@/lib/ui/sweet-alert";
import "sweetalert2/dist/sweetalert2.min.css";
import {
  ToolListingTracker,
  trackDirectoryOutboundClick,
  trackDirectoryProfileClick
} from "@/components/analytics/tool-listing-tracker";
import { useAppStore } from "@/store/app-store";
import type { Tool } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToolLogo } from "@/components/ui/tool-logo";

export function ToolCard({ tool, analyticsSource = "directory" }: { tool: Tool; analyticsSource?: "directory" | "home" | "search" }) {
  const { bookmarkedToolIds, toggleBookmark } = useAppStore();
  const isBookmarked = bookmarkedToolIds.includes(tool.id);
  const [bookmarkMessage, setBookmarkMessage] = useState<string | null>(null);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [pendingClaimRequest, setPendingClaimRequest] = useState(false);
  const isUnclaimed = !tool.founderId;

  useEffect(() => {
    if (!isUnclaimed) {
      return;
    }

    let cancelled = false;

    async function loadPendingClaim() {
      try {
        const response = await fetch("/api/listing-claim-requests/mine");
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { requests: Array<{ tool: { id: string }; status: string }> };
        const hasPending = payload.requests.some(
          (request) => request.tool.id === tool.id && request.status === "pending"
        );

        if (!cancelled && hasPending) {
          setPendingClaimRequest(true);
        }
      } catch {
        // ignore — card still works without prefetch
      }
    }

    void loadPendingClaim();

    return () => {
      cancelled = true;
    };
  }, [isUnclaimed, tool.id]);

  async function handleBookmark() {
    const message = await toggleBookmark(tool.id);
    setBookmarkMessage(message);
  }

  async function handleClaimRequestClick() {
    try {
      const response = await fetch("/api/auth/me");
      const payload = (await response.json()) as { user: { id: string } | null };

      if (!payload.user) {
        void showInfoAlert({
          title: "Sign in required",
          text: "Please sign in to request a listing claim."
        }).then(() => {
          window.location.href = `/auth/login?next=${encodeURIComponent("/directory")}`;
        });
        return;
      }

      if (pendingClaimRequest) {
        void showInfoAlert({
          title: "Request pending",
          text: "You already submitted a claim request for this listing."
        });
        return;
      }

      setClaimDialogOpen(true);
    } catch {
      void showInfoAlert({ title: "Could not verify login", text: "Please try again." });
    }
  }

  function handleClaimSubmitted() {
    setPendingClaimRequest(true);
  }

  return (
    <>
    <Card className="group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-glow">
      <ToolListingTracker toolId={tool.id} source={analyticsSource} />
      <CardContent className="grid gap-4 p-4">
        <div className="flex gap-4">
          <ToolLogo src={tool.logoUrl} alt={`${tool.name} logo`} width={64} height={64} className="h-16 w-16 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/tools/${tool.slug}`}
                className="truncate text-lg font-semibold hover:text-primary"
                onClick={() => trackDirectoryProfileClick(tool.id, analyticsSource)}
              >
                {tool.name}
              </Link>
              {tool.verified ? (
                <Badge variant="verified">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Verified
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{tool.tagline}</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Bookmark tool" onClick={() => void handleBookmark()}>
            <Bookmark className={isBookmarked ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {tool.categories.slice(0, 3).map((category) => (
            <Badge key={category} variant="secondary">
              {category}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-md bg-secondary/50 p-3 text-sm">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-medium">{tool.reviewCount ? tool.rating.toFixed(1) : "—"}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium text-foreground">{tool.trendingScore}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            <span className="font-medium text-foreground">
              {tool.growthRate >= 0 ? "+" : ""}
              {tool.growthRate}%
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            From <span className="font-semibold text-foreground">${tool.startingPrice}</span>/mo
          </span>
          <div className="flex flex-wrap gap-2">
            {isUnclaimed ? (
              <Button size="sm" variant="secondary" onClick={() => void handleClaimRequestClick()}>
                <Handshake className="mr-2 h-3.5 w-3.5" />
                {pendingClaimRequest ? "Request pending" : "Claim request"}
              </Button>
            ) : null}
            <Button asChild size="sm" variant="outline">
              <a
                href={tool.affiliateUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackDirectoryOutboundClick(tool.id, analyticsSource)}
              >
                Visit
                <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    {isUnclaimed ? (
      <ClaimRequestDialog
        tool={tool}
        open={claimDialogOpen}
        onClose={() => setClaimDialogOpen(false)}
        onSubmitted={handleClaimSubmitted}
      />
    ) : null}
    </>
  );
}
