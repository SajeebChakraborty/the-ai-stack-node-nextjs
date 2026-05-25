import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.ytimg.com" }
    ]
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"]
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Default: never cache HTML / RSC payloads at any proxy or CDN.
        // Prevents the "old home page on first visit" issue caused by stale
        // upstream caches (Nginx proxy_cache, Cloudflare, etc.).
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
          { key: "CDN-Cache-Control", value: "no-store" }
        ]
      },
      {
        // Override for hashed, immutable build assets — safe to cache forever.
        // (Later rules win when multiple sources match.)
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }]
      },
      {
        // Same for the optimized image cache.
        source: "/_next/image/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }]
      }
    ];
  }
};

export default nextConfig;
