import type { Role } from "@/types/domain";
import { canUseMemberDashboard, MEMBER_DASHBOARD_ROLES } from "@/lib/auth/member-roles";
import { getDefaultHomeForRole } from "@/lib/auth/session-token";

export type AuthPortal = "user" | "founder" | "admin";

const userPortalRoles: Role[] = [...MEMBER_DASHBOARD_ROLES];

// Legacy founder-only login path (UI hidden; routes still redirect here to /auth/login).
export const legacyFounderLoginPath = "/auth/founder/login";

export function getLoginPathForPortal(portal: AuthPortal) {
  switch (portal) {
    case "admin":
      return "/auth/admin/login";
    case "founder":
      // return "/auth/founder/login";
      return "/auth/login";
    default:
      return "/auth/login";
  }
}

export function getLoginPathForRole(role: Role) {
  return getLoginPathForPortal(getPortalForRole(role));
}

export function getPortalForRole(role: Role): AuthPortal {
  if (role === "admin") {
    return "admin";
  }

  // if (role === "founder") {
  //   return "founder";
  // }

  return "user";
}

export function isRoleAllowedInPortal(role: Role, portal: AuthPortal) {
  switch (portal) {
    case "admin":
      return role === "admin";
    case "founder":
      return canUseMemberDashboard(role);
    default:
      return userPortalRoles.includes(role);
  }
}

export function getPortalAccessError(role: Role, portal: AuthPortal) {
  if (isRoleAllowedInPortal(role, portal)) {
    return null;
  }

  const actualPortal = getPortalForRole(role);
  return `This account is a ${role} account. Sign in from the ${actualPortal} login page instead.`;
}

export function getHomeForRole(role: Role) {
  return getDefaultHomeForRole(role);
}

export function getProfilePathForRole(role: Role) {
  if (role === "admin") {
    return "/admin/profile";
  }

  // if (role === "founder") {
  //   return "/founder/profile";
  // }

  return "/account/profile";
}
