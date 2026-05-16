import { NextResponse } from "next/server";
import { resolveAppOriginFromRequest } from "@/lib/auth/app-origin";
import {
  buildGoogleAuthorizationUrl,
  getGoogleLoginPath,
  resolvePostLoginPath
} from "@/lib/auth/google";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = resolvePostLoginPath(requestUrl.searchParams.get("next"));
  const appOrigin = resolveAppOriginFromRequest(request);

  try {
    const authorizationUrl = buildGoogleAuthorizationUrl({
      next,
      origin: appOrigin
    });

    return NextResponse.redirect(authorizationUrl);
  } catch {
    const loginUrl = new URL(getGoogleLoginPath(), appOrigin);
    loginUrl.searchParams.set("next", next);
    loginUrl.searchParams.set("error", "google-not-configured");
    return NextResponse.redirect(loginUrl);
  }
}
