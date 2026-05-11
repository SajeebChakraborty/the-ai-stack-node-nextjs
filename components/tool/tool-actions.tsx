"use client";

import { Bookmark, ExternalLink } from "lucide-react";
import type { Tool } from "@/types/domain";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";

export function ToolActions({ tool }: { tool: Tool }) {
  const { bookmarkedToolIds, toggleBookmark } = useAppStore();
  const isBookmarked = bookmarkedToolIds.includes(tool.id);

  return (
    <>
      <Button asChild size="lg">
        <a href={tool.affiliateUrl} target="_blank" rel="noreferrer">
          Visit website
          <ExternalLink className="ml-2 h-4 w-4" />
        </a>
      </Button>
      <Button variant="outline" onClick={() => toggleBookmark(tool.id)}>
        <Bookmark className={isBookmarked ? "mr-2 h-4 w-4 fill-primary text-primary" : "mr-2 h-4 w-4"} />
        {isBookmarked ? "Bookmarked" : "Bookmark tool"}
      </Button>
    </>
  );
}
