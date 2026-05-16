import { NextResponse } from "next/server";
import {
  buildGoogleAuthorizationUrl,
  getGoogleLoginPath,
  resolvePostLoginPath
} from "@/lib/auth/google";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = resolvePostLoginPath(requestUrl.searchParams.get("next"));

  try {
    const authorizationUrl = buildGoogleAuthorizationUrl({
      next,
      origin: requestUrl.origin
    });

    return NextResponse.redirect(authorizationUrl);
  } catch {
    const loginUrl = new URL(getGoogleLoginPath(), request.url);
    loginUrl.searchParams.set("next", next);
    loginUrl.searchParams.set("error", "google-not-configured");
    return NextResponse.redirect(loginUrl);
  }
}
