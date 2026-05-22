"use client";

import { createContext, useContext } from "react";

export type UserDashboardView =
  | "dashboard"
  | "create"
  | "list"
  | "membership"
  | "bookmarks"
  | "claim-requests"
  | "my-courses"
  | "create-course"
  | "my-created-courses"
  | "create-automation"
  | "my-created-automations"
  | "my-purchased-automations"
  | "wallet";

type UserDashboardNavContextValue = {
  setView: (view: UserDashboardView) => void;
};

export const UserDashboardNavContext = createContext<UserDashboardNavContextValue | null>(null);

export function useUserDashboardNav() {
  return useContext(UserDashboardNavContext);
}
