import type { Metadata, Viewport } from "next";
import { AppShellClient } from "@/components/layout/app-shell-client";
import { AdminPanelHeader } from "@/components/layout/admin-panel-header";
import { AuthAwareHeader } from "@/components/layout/auth-aware-header";
import { SiteFooterAsync } from "@/components/layout/site-footer-async";
import { AppProviders } from "@/components/providers/query-provider";
import { fontDisplay, fontSans } from "@/lib/fonts";
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
  themeColor: "#ffffff"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fontSans.variable} ${fontDisplay.variable}`}>
      <body className="font-sans">
        <AppProviders>
          <AppShellClient
            header={<AuthAwareHeader />}
            footer={<SiteFooterAsync />}
            adminHeader={<AdminPanelHeader />}
          >
            {children}
          </AppShellClient>
        </AppProviders>
      </body>
    </html>
  );
}
