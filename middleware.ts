import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get("host") ?? "";
  const adminHost = process.env.ADMIN_SUBDOMAIN_HOST;
  const isConfiguredAdminHost = adminHost ? host.split(":")[0] === adminHost : host.startsWith("admin.");

  if (
    isConfiguredAdminHost &&
    !url.pathname.startsWith("/admin") &&
    !url.pathname.startsWith("/api") &&
    !url.pathname.startsWith("/auth") &&
    !url.pathname.startsWith("/_next")
  ) {
    url.pathname = `/admin${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next({
    request: {
      headers: request.headers
    }
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
