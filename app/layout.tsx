import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { AppProviders } from "@/components/providers/query-provider";
import { siteSettings } from "@/data/catalog";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: siteSettings.title,
    template: `%s | ${siteSettings.title}`
  },
  description: siteSettings.description,
  openGraph: {
    title: siteSettings.title,
    description: siteSettings.description,
    siteName: siteSettings.title,
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: siteSettings.title,
    description: siteSettings.description
  },
  robots: {
    index: true,
    follow: true
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d111b" }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
