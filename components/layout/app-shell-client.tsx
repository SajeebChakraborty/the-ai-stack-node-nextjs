"use client";

import { usePathname } from "next/navigation";
import { BookmarkHydrator } from "@/components/bookmarks/bookmark-hydrator";
import { SiteFooter } from "@/components/layout/site-footer";

export function AppShellClient({
  children,
  header,
  adminHeader
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  adminHeader?: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminSurface = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdminSurface) {
    return (
      <div className="min-h-screen bg-background">
        {adminHeader}
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <BookmarkHydrator />
      {header}
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
