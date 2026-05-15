"use client";

import { create } from "zustand";

type AppStore = {
  bookmarkedToolIds: string[];
  compareToolIds: string[];
  setBookmarkedToolIds: (toolIds: string[]) => void;
  toggleBookmark: (toolId: string) => Promise<string | null>;
  toggleCompare: (toolId: string) => void;
};

export const useAppStore = create<AppStore>((set, get) => ({
  bookmarkedToolIds: [],
  compareToolIds: [],
  setBookmarkedToolIds: (toolIds) => set({ bookmarkedToolIds: toolIds }),
  toggleBookmark: async (toolId) => {
    const isBookmarked = get().bookmarkedToolIds.includes(toolId);

    try {
      const response = await fetch("/api/bookmarks", {
        method: isBookmarked ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ toolId })
      });

      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        return payload.error ?? "Could not update bookmark.";
      }

      set((state) => ({
        bookmarkedToolIds: isBookmarked
          ? state.bookmarkedToolIds.filter((id) => id !== toolId)
          : [...state.bookmarkedToolIds, toolId]
      }));

      return null;
    } catch {
      return "Could not update bookmark.";
    }
  },
  toggleCompare: (toolId) =>
    set((state) => ({
      compareToolIds: state.compareToolIds.includes(toolId)
        ? state.compareToolIds.filter((id) => id !== toolId)
        : state.compareToolIds.length >= 4
          ? [...state.compareToolIds.slice(1), toolId]
          : [...state.compareToolIds, toolId]
    }))
}));
