import type { Role } from "@/types/domain";
import { MEMBER_DASHBOARD_ROLES } from "@/lib/auth/member-roles";
import { getDefaultHomeForRole, getLoginPathForRoles } from "@/lib/auth/session-token";

export const adminLoginPath = "/auth/admin/login";
/** @deprecated Separate founder login hidden — use userLoginPath. */
export const founderLoginPath = "/auth/founder/login";
export const userLoginPath = "/auth/login";

export type RouteGuard = {
  match: (pathname: string) => boolean;
  allowedRoles?: Role[];
  methods?: string[];
  loginPath?: string;
};

export function isAuthPath(pathname: string) {
  return pathname === "/auth" || pathname.startsWith("/auth/");
}

export function isAdminAppRoute(pathname: string) {
  if (isAuthPath(pathname)) {
    return false;
  }

  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isFounderAppRoute(pathname: string) {
  if (isAuthPath(pathname)) {
    return false;
  }

  return pathname === "/founder" || pathname.startsWith("/founder/");
}

export function isUserAppRoute(pathname: string) {
  if (isAuthPath(pathname)) {
    return false;
  }

  return pathname === "/user" || pathname.startsWith("/user/");
}

export const protectedRouteGuards: RouteGuard[] = [
  {
    match: isAdminAppRoute,
    allowedRoles: ["admin"],
    loginPath: adminLoginPath
  },
  {
    match: isUserAppRoute,
    allowedRoles: [...MEMBER_DASHBOARD_ROLES],
    loginPath: userLoginPath
  },
  {
    match: isFounderAppRoute,
    allowedRoles: [...MEMBER_DASHBOARD_ROLES],
    loginPath: userLoginPath
    // allowedRoles: ["founder"],
    // loginPath: founderLoginPath
  },
  {
    match: (pathname) => pathname === "/creator" || pathname.startsWith("/creator/"),
    allowedRoles: ["creator"],
    loginPath: userLoginPath
  },
  {
    match: (pathname) => pathname === "/account" || pathname.startsWith("/account/"),
    allowedRoles: [...MEMBER_DASHBOARD_ROLES],
    loginPath: userLoginPath
  },
  {
    match: (pathname) => pathname.startsWith("/api/admin/"),
    allowedRoles: ["admin"],
    loginPath: adminLoginPath
  },
  {
    match: (pathname) => pathname.startsWith("/api/founder/"),
    allowedRoles: [...MEMBER_DASHBOARD_ROLES],
    loginPath: userLoginPath
    // allowedRoles: ["founder"],
    // loginPath: founderLoginPath
  },
  {
    match: (pathname) => pathname === "/api/stripe/checkout" || pathname === "/api/stripe/portal",
    allowedRoles: ["user", "creator", "founder", "moderator"],
    loginPath: userLoginPath
  },
  {
    match: (pathname) => pathname.startsWith("/api/discussions/"),
    loginPath: userLoginPath
  },
  {
    match: (pathname) => /^\/api\/tools\/[^/]+\/(reviews|discussions)$/.test(pathname),
    methods: ["POST"],
    loginPath: userLoginPath
  }
];

const publicAuthPaths = new Set([
  userLoginPath,
  adminLoginPath,
  founderLoginPath, // legacy URL redirects to user login
  "/auth/callback",
  "/auth/verify-email"
]);

export function isPublicAuthPath(pathname: string) {
  if (publicAuthPaths.has(pathname)) {
    return true;
  }

  return pathname.startsWith("/api/auth/");
}

export function findRouteGuard(pathname: string, method: string) {
  return protectedRouteGuards.find((guard) => {
    if (!guard.match(pathname)) {
      return false;
    }

    if (guard.methods?.length && !guard.methods.includes(method.toUpperCase())) {
      return false;
    }

    return true;
  });
}

export function getLoginRedirect(pathname: string, guard: RouteGuard) {
  const loginPath = guard.loginPath ?? getLoginPathForRoles(guard.allowedRoles);
  return `${loginPath}?next=${encodeURIComponent(pathname)}`;
}

export function getRoleRedirect(role: Role) {
  return getDefaultHomeForRole(role);
}

export function hasRequiredRole(role: Role, allowedRoles?: Role[]) {
  if (!allowedRoles?.length) {
    return true;
  }

  return allowedRoles.includes(role);
}
