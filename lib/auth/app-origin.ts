import "server-only";

function isUnusablePublicHost(hostname: string) {
  const host = hostname.toLowerCase();
  return host === "0.0.0.0" || host === "127.0.0.1" || host === "localhost";
}

function normalizeOrigin(value: string) {
  return value.replace(/\/$/, "");
}

/**
 * Canonical public site origin for emails, OAuth, and redirects.
 * Prefers NEXT_PUBLIC_APP_URL when it is a real public host (not 0.0.0.0).
 */
export function resolveAppOrigin(fallbackOrigin?: string) {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (fromEnv) {
    try {
      const envUrl = new URL(fromEnv);
      if (!isUnusablePublicHost(envUrl.hostname)) {
        return normalizeOrigin(envUrl.origin);
      }
      if (envUrl.hostname === "0.0.0.0") {
        envUrl.hostname = "localhost";
        return normalizeOrigin(envUrl.origin);
      }
    } catch {
      // ignore invalid env URL
    }
  }

  if (fallbackOrigin) {
    try {
      const url = new URL(fallbackOrigin);
      if (!isUnusablePublicHost(url.hostname)) {
        return normalizeOrigin(url.origin);
      }
      if (url.hostname === "0.0.0.0") {
        url.hostname = "localhost";
        return normalizeOrigin(url.origin);
      }
    } catch {
      // ignore
    }
  }

  return "http://localhost:3000";
}

/**
 * Resolve origin from an incoming request (proxy-safe).
 * Uses X-Forwarded-* / Host before the internal Node bind address.
 */
export function resolveAppOriginFromRequest(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const hostHeader = forwardedHost ?? request.headers.get("host")?.trim();

  if (hostHeader) {
    const hostname = hostHeader.split(":")[0] ?? hostHeader;
    if (!isUnusablePublicHost(hostname)) {
      const proto =
        forwardedProto ??
        (() => {
          try {
            return new URL(request.url).protocol.replace(":", "");
          } catch {
            return hostname.includes("localhost") ? "http" : "https";
          }
        })();
      return normalizeOrigin(`${proto}://${hostHeader}`);
    }
  }

  try {
    return resolveAppOrigin(new URL(request.url).origin);
  } catch {
    return resolveAppOrigin();
  }
}

export function buildAppUrl(path: string, request?: Request) {
  const origin = request ? resolveAppOriginFromRequest(request) : resolveAppOrigin();
  return new URL(path, origin);
}
