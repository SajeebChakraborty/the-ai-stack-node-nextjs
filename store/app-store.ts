"use client";

import { create } from "zustand";

type AppStore = {
  bookmarkedToolIds: string[];
  compareToolIds: string[];
  toggleBookmark: (toolId: string) => void;
  toggleCompare: (toolId: string) => void;
};

export const useAppStore = create<AppStore>((set) => ({
  bookmarkedToolIds: [],
  compareToolIds: [],
  toggleBookmark: (toolId) =>
    set((state) => ({
      bookmarkedToolIds: state.bookmarkedToolIds.includes(toolId)
        ? state.bookmarkedToolIds.filter((id) => id !== toolId)
        : [...state.bookmarkedToolIds, toolId]
    })),
  toggleCompare: (toolId) =>
    set((state) => ({
      compareToolIds: state.compareToolIds.includes(toolId)
        ? state.compareToolIds.filter((id) => id !== toolId)
        : state.compareToolIds.length >= 4
          ? [...state.compareToolIds.slice(1), toolId]
          : [...state.compareToolIds, toolId]
    }))
}));
