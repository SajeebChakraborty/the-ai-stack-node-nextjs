"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import type { Role } from "@/types/domain";
import { getHomeForRole } from "@/lib/auth/portals";
import { navItems } from "@/lib/constants/navigation";
import { PanelAccountMenu } from "@/components/layout/panel-account-menu";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

type HeaderUser = {
  name: string;
  email: string;
  role: Role;
};

export function SiteHeader({ user }: { user: HeaderUser | null }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const dashboardPath = user ? getHomeForRole(user.role) : null;
  const isOnDashboard =
    Boolean(user) &&
    (pathname === dashboardPath ||
      pathname.startsWith("/founder/") ||
      pathname.startsWith("/creator/") ||
      pathname.startsWith("/account/"));

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
          {user && dashboardPath && !isOnDashboard ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={dashboardPath}>Dashboard</Link>
            </Button>
          ) : null}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href="/search">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Link>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          {user ? (
            <PanelAccountMenu user={user} />
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button asChild size="sm" variant="outline">
                <Link href="/auth/login">User</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/auth/founder/login">Founder</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/admin/login">Admin</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
