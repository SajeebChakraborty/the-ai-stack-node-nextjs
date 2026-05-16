"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bookmark, ExternalLink, Trash2 } from "lucide-react";
import { ToolLogo } from "@/components/ui/tool-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MembershipBookmark } from "@/lib/queries/membership";
import { showErrorAlert, showSuccessAlert } from "@/lib/ui/sweet-alert";
import { useAppStore } from "@/store/app-store";

export function BookmarksPanel({ initialBookmarks }: { initialBookmarks: MembershipBookmark[] }) {
  const router = useRouter();
  const setBookmarkedToolIds = useAppStore((state) => state.setBookmarkedToolIds);
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function removeBookmark(toolId: string) {
    setRemovingId(toolId);

    try {
      const response = await fetch("/api/bookmarks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        void showErrorAlert({ title: "Could not remove bookmark", text: payload.error ?? "Try again." });
        return;
      }

      setBookmarks((current) => current.filter((bookmark) => bookmark.toolId !== toolId));
      setBookmarkedToolIds(useAppStore.getState().bookmarkedToolIds.filter((id) => id !== toolId));
      void showSuccessAlert({ title: "Bookmark removed", text: "This listing was removed from your bookmarks." });
      router.refresh();
    } catch {
      void showErrorAlert({ title: "Could not remove bookmark", text: "Something went wrong. Please try again." });
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-border/60 pb-6">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Bookmarks</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Saved listings</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
          Every tool you saved from the directory. Open a listing or remove it from your list.
        </p>
      </div>

      <Card className="border-border/80 bg-card/50 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            Bookmark list
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {bookmarks.length} saved listing{bookmarks.length === 1 ? "" : "s"}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {bookmarks.length ? (
            bookmarks.map((bookmark) => (
              <div
                key={bookmark.toolId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/40 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <ToolLogo
                    alt={bookmark.name}
                    src={bookmark.logoUrl}
                    width={44}
                    height={44}
                    className="h-11 w-11 shrink-0 rounded-lg border border-border/60 object-cover"
                  />
                  <div className="min-w-0">
                    <Link href={`/tools/${bookmark.slug}`} className="font-medium hover:text-primary">
                      {bookmark.name}
                    </Link>
                    <p className="line-clamp-1 text-sm text-muted-foreground">{bookmark.tagline}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/tools/${bookmark.slug}`}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={removingId === bookmark.toolId}
                    onClick={() => removeBookmark(bookmark.toolId)}
                    aria-label={`Remove ${bookmark.name} from bookmarks`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-border/80 p-8 text-center text-sm text-muted-foreground">
              No bookmarks yet. Save tools from the directory to see them here.
              <div className="mt-4">
                <Button asChild size="sm">
                  <Link href="/directory">Browse directory</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
