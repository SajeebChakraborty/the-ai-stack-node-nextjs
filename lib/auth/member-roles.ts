import type { Role } from "@/types/domain";

/** Non-admin roles that share one login, listing dashboard, claims, and plan entitlements. */
export const MEMBER_DASHBOARD_ROLES = ["user", "creator", "moderator", "founder"] as const satisfies readonly Role[];

export type MemberDashboardRole = (typeof MEMBER_DASHBOARD_ROLES)[number];

export function canUseMemberDashboard(role: Role): role is MemberDashboardRole {
  return (MEMBER_DASHBOARD_ROLES as readonly Role[]).includes(role);
}

export function canClaimAndManageListings(role: Role) {
  return canUseMemberDashboard(role);
}

export function getMemberCompanyName(displayName: string) {
  const firstName = displayName.trim().split(/\s+/)[0] ?? "Member";
  return `${firstName}'s company`;
}

/** Header account badge — hide legacy `founder` label; members show as User. */
export function getHeaderRoleLabel(role: Role): string | null {
  if (role === "founder") {
    return null;
  }

  if (role === "user" || role === "moderator") {
    return "User";
  }

  if (role === "creator") {
    return "Creator";
  }

  if (role === "admin") {
    return "Admin";
  }

  return null;
}
