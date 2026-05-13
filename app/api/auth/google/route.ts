import { NextResponse } from "next/server";
import { buildGoogleAuthorizationUrl, getDefaultPathForGoogleRole, getGoogleLoginPath } from "@/lib/auth/google";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const role = requestUrl.searchParams.get("role") === "founder" ? "founder" : "user";
  const next = requestUrl.searchParams.get("next") ?? getDefaultPathForGoogleRole(role);

  try {
    const authorizationUrl = buildGoogleAuthorizationUrl({
      role,
      next,
      origin: requestUrl.origin
    });

    return NextResponse.redirect(authorizationUrl);
  } catch {
    const loginUrl = new URL(getGoogleLoginPath(role), request.url);
    loginUrl.searchParams.set("next", next.startsWith("/") ? next : getDefaultPathForGoogleRole(role));
    loginUrl.searchParams.set("error", "google-not-configured");
    return NextResponse.redirect(loginUrl);
  }
}
