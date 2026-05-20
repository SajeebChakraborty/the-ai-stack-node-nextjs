"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  CheckCircle2,
  ExternalLink,
  Handshake,
  Shield,
  Star,
  TrendingUp
} from "lucide-react";
import { ClaimRequestDialog } from "@/components/directory/claim-request-dialog";
import { ToolCardPromoVideo } from "@/components/directory/tool-card-promo-video";
import { showInfoAlert } from "@/lib/ui/sweet-alert";
import "sweetalert2/dist/sweetalert2.min.css";
import {
  ToolListingTracker,
  trackDirectoryOutboundClick,
  trackDirectoryProfileClick
} from "@/components/analytics/tool-listing-tracker";
import { useAppStore } from "@/store/app-store";
import type { Tool } from "@/types/domain";
import { formatToolPricing, getToolCardSubtitle, toolHasPromoMedia } from "@/lib/utils/tool-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RemoteImage } from "@/components/ui/remote-image";
import { ToolLogo } from "@/components/ui/tool-logo";
import { cn } from "@/lib/utils/cn";

function ToolCardMedia({ tool }: { tool: Tool }) {
  const hasVideo = Boolean(tool.promoVideoUrl?.trim() || tool.videos?.[0]?.embedUrl?.trim());
  const screenshot = tool.screenshots?.[0]?.trim();

  if (hasVideo) {
    return (
      <ToolCardPromoVideo
        toolId={tool.id}
        toolName={tool.name}
        promoVideoUrl={tool.promoVideoUrl}
        videos={tool.videos}
      />
    );
  }

  if (screenshot) {
    return (
      <>
        <RemoteImage
          src={screenshot}
          alt={`${tool.name} preview`}
          width={640}
          height={360}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/25 to-transparent" />
      </>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary/15 via-background to-violet-950/30 p-6">
      <ToolLogo src={tool.logoUrl} alt={`${tool.name} logo`} width={72} height={72} className="rounded-2xl shadow-lg ring-2 ring-background/80" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_55%)]" />
    </div>
  );
}

export function ToolCard({
  tool,
  analyticsSource = "directory",
  pendingClaimRequest: pendingClaimRequestProp
}: {
  tool: Tool;
  analyticsSource?: "directory" | "home" | "search";
  pendingClaimRequest?: boolean;
}) {
  const { bookmarkedToolIds, toggleBookmark } = useAppStore();
  const isBookmarked = bookmarkedToolIds.includes(tool.id);
  const [bookmarkMessage, setBookmarkMessage] = useState<string | null>(null);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [pendingClaimRequest, setPendingClaimRequest] = useState(pendingClaimRequestProp ?? false);
  const isUnclaimed = !tool.founderId;
  const subtitle = getToolCardSubtitle(tool);
  const extraCategories = Math.max(0, tool.categories.length - 2);

  useEffect(() => {
    if (pendingClaimRequestProp !== undefined) {
      setPendingClaimRequest(pendingClaimRequestProp);
      return;
    }

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
        // ignore
      }
    }

    void loadPendingClaim();

    return () => {
      cancelled = true;
    };
  }, [isUnclaimed, pendingClaimRequestProp, tool.id]);

  async function handleBookmark(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
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
      <article
        className={cn(
          "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition duration-300",
          "hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow",
          toolHasPromoMedia(tool) && "ring-1 ring-primary/5"
        )}
      >
        <ToolListingTracker toolId={tool.id} source={analyticsSource} />

        {/* Media — fixed height keeps the grid aligned */}
        <div className="relative h-[11.5rem] shrink-0 overflow-hidden border-b border-border/50 sm:h-[12.5rem]">
          <ToolCardMedia tool={tool} />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
            <div className="flex flex-wrap gap-1.5">
              {tool.verified ? (
                <Badge variant="verified" className="shadow-sm">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Verified
                </Badge>
              ) : null}
              {isUnclaimed ? (
                <Badge variant="outline" className="border-amber-500/40 bg-background/80 text-amber-600 backdrop-blur-sm dark:text-amber-400">
                  Unclaimed
                </Badge>
              ) : null}
            </div>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full border-0 bg-background/80 shadow-sm backdrop-blur-sm hover:bg-background"
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark tool"}
              onClick={(event) => void handleBookmark(event)}
            >
              <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-primary text-primary")} />
            </Button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 flex items-end gap-3 p-3">
            <ToolLogo
              src={tool.logoUrl}
              alt={`${tool.name} logo`}
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 rounded-xl object-cover ring-2 ring-background shadow-md"
            />
            <div className="min-w-0 flex-1 pb-0.5">
              <Link
                href={`/tools/${tool.slug}`}
                className="block truncate font-display text-base font-semibold text-foreground drop-shadow-sm transition hover:text-primary"
                onClick={() => trackDirectoryProfileClick(tool.id, analyticsSource)}
              >
                {tool.name}
              </Link>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-3 p-4">
          <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-snug text-muted-foreground">{subtitle}</p>

          <div className="flex flex-wrap gap-1.5">
            {tool.categories.slice(0, 2).map((category) => (
              <Badge key={category} variant="secondary" className="text-[11px] font-normal">
                {category}
              </Badge>
            ))}
            {extraCategories > 0 ? (
              <Badge variant="outline" className="text-[11px] font-normal">
                +{extraCategories}
              </Badge>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-secondary/60 px-2.5 py-2 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-500">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {tool.reviewCount ? tool.rating.toFixed(1) : "—"}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Rating</p>
            </div>
            <div className="rounded-lg bg-secondary/60 px-2.5 py-2 text-center">
              <div className="flex items-center justify-center gap-1 text-primary">
                <Shield className="h-3.5 w-3.5" />
                <span className="text-sm font-semibold tabular-nums text-foreground">{tool.trustScore}</span>
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Trust</p>
            </div>
            <div className="rounded-lg bg-secondary/60 px-2.5 py-2 text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-500">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {tool.growthRate >= 0 ? "+" : ""}
                  {tool.growthRate}%
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Growth</p>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-2 border-t border-border/50 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-muted-foreground sm:text-sm">{formatToolPricing(tool)}</span>
            <div className="flex flex-wrap gap-2">
              {isUnclaimed ? (
                <Button size="sm" variant="ghost" className="h-8 px-2.5 text-xs" onClick={() => void handleClaimRequestClick()}>
                  <Handshake className="mr-1.5 h-3.5 w-3.5" />
                  {pendingClaimRequest ? "Pending" : "Claim"}
                </Button>
              ) : null}
              <Button asChild size="sm" className="h-8 flex-1 sm:flex-none">
                <Link
                  href={`/tools/${tool.slug}`}
                  onClick={() => trackDirectoryProfileClick(tool.id, analyticsSource)}
                >
                  Profile
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="h-8 flex-1 sm:flex-none">
                <a
                  href={tool.affiliateUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackDirectoryOutboundClick(tool.id, analyticsSource)}
                >
                  Visit
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        {bookmarkMessage ? (
          <p className="sr-only" role="status">
            {bookmarkMessage}
          </p>
        ) : null}
      </article>

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
