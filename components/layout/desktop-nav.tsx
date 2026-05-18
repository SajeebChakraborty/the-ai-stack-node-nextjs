"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/constants/navigation";
import { isNavActive } from "@/lib/navigation/active-route";
import { cn } from "@/lib/utils/cn";

type DesktopNavProps = {
  dashboardHref?: string | null;
  showDashboard?: boolean;
};

export function DesktopNav({ dashboardHref, showDashboard }: DesktopNavProps) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
      {navItems.map((item) => {
        const active = isNavActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary hover:text-foreground",
              active ? "bg-secondary text-foreground" : "text-muted-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
      {showDashboard && dashboardHref ? (
        <Link
          href={dashboardHref}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary hover:text-foreground",
            isNavActive(pathname, dashboardHref) ? "bg-secondary text-foreground" : "text-muted-foreground"
          )}
        >
          Dashboard
        </Link>
      ) : null}
    </nav>
  );
}
