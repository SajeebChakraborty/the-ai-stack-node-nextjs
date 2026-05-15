"use client";

import { useState } from "react";
import { Bookmark, ExternalLink } from "lucide-react";
import type { Tool } from "@/types/domain";
import { trackToolOutboundClick } from "@/components/analytics/tool-listing-tracker";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";

export function ToolActions({ tool }: { tool: Tool }) {
  const { bookmarkedToolIds, toggleBookmark } = useAppStore();
  const isBookmarked = bookmarkedToolIds.includes(tool.id);
  const [bookmarkMessage, setBookmarkMessage] = useState<string | null>(null);

  async function handleBookmark() {
    const message = await toggleBookmark(tool.id);
    setBookmarkMessage(message);
  }

  return (
    <>
      <Button asChild size="lg">
        <a href={tool.affiliateUrl} target="_blank" rel="noreferrer" onClick={() => trackToolOutboundClick(tool.id)}>
          Visit website
          <ExternalLink className="ml-2 h-4 w-4" />
        </a>
      </Button>
      <Button variant="outline" onClick={() => void handleBookmark()}>
        <Bookmark className={isBookmarked ? "mr-2 h-4 w-4 fill-primary text-primary" : "mr-2 h-4 w-4"} />
        {isBookmarked ? "Bookmarked" : "Bookmark tool"}
      </Button>
      {bookmarkMessage ? <p className="text-sm text-amber-200">{bookmarkMessage}</p> : null}
    </>
  );
}
