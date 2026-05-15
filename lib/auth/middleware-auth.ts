import { NextResponse, type NextRequest } from "next/server";
import { authSessionCookie, decodeSessionCookie } from "@/lib/auth/session-token";
import {
  findRouteGuard,
  getLoginRedirect,
  getRoleRedirect,
  hasRequiredRole,
  isPublicAuthPath
} from "@/lib/auth/route-guards";

export async function enforceRouteAuth(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicAuthPath(pathname) || pathname.startsWith("/api/stripe/webhook")) {
    return null;
  }

  const guard = findRouteGuard(pathname, request.method);
  if (!guard) {
    return null;
  }

  const session = await decodeSessionCookie(request.cookies.get(authSessionCookie)?.value);
  const loginRedirect = getLoginRedirect(pathname, guard);

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    return NextResponse.redirect(new URL(loginRedirect, request.url));
  }

  if (!hasRequiredRole(session.role, guard.allowedRoles)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "You do not have access to this resource." }, { status: 403 });
    }

    return NextResponse.redirect(new URL(getRoleRedirect(session.role), request.url));
  }

  return null;
}
