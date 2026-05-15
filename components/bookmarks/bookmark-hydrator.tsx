"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";

export function BookmarkHydrator() {
  const setBookmarkedToolIds = useAppStore((state) => state.setBookmarkedToolIds);

  useEffect(() => {
    async function loadBookmarks() {
      try {
        const response = await fetch("/api/bookmarks");
        const payload = (await response.json()) as { toolIds?: string[] };
        setBookmarkedToolIds(payload.toolIds ?? []);
      } catch {
        setBookmarkedToolIds([]);
      }
    }

    void loadBookmarks();
  }, [setBookmarkedToolIds]);

  return null;
}
