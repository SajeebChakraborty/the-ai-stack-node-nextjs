import { NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/auth/email-verification";

function buildRedirect(request: Request, path: string, searchKey: "error" | "message", value: string) {
  const redirectUrl = new URL(path, request.url);
  redirectUrl.searchParams.set(searchKey, value);
  return NextResponse.redirect(redirectUrl);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token");
  const requestedRole = requestUrl.searchParams.get("role") === "founder" ? "founder" : "user";
  const fallbackLoginPath = requestedRole === "founder" ? "/auth/founder/login" : "/auth/login";

  if (!token) {
    return buildRedirect(request, fallbackLoginPath, "error", "verification-link-invalid");
  }

  try {
    const result = await verifyEmailToken(token);
    if (!result) {
      return buildRedirect(request, fallbackLoginPath, "error", "verification-link-invalid");
    }

    return buildRedirect(request, result.loginPath, "message", "email-verified");
  } catch {
    return buildRedirect(request, fallbackLoginPath, "error", "verification-link-invalid");
  }
}
