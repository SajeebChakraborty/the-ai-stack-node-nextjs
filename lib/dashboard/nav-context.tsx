"use client";

import { createContext, useContext } from "react";

export type UserDashboardView = "dashboard" | "create" | "list" | "membership" | "bookmarks" | "claim-requests";

type UserDashboardNavContextValue = {
  setView: (view: UserDashboardView) => void;
};

export const UserDashboardNavContext = createContext<UserDashboardNavContextValue | null>(null);

export function useUserDashboardNav() {
  return useContext(UserDashboardNavContext);
}
