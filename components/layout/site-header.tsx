"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import type { Role } from "@/types/domain";
import { getHomeForRole } from "@/lib/auth/portals";
import { AccountMenu } from "@/components/layout/account-menu";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type HeaderUser = {
  name: string;
  email: string;
  role: Role;
};

// Routes that render a dark, immersive animated hero. The header goes
// transparent-dark over the hero and solidifies into dark glass on scroll.
const IMMERSIVE_ROUTES = new Set(["/", "/courses", "/automations", "/directory", "/rankings", "/pricing"]);

export function SiteHeader({ user }: { user: HeaderUser | null }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const dashboardPath = user ? getHomeForRole(user.role) : null;
  const isOnDashboard =
    Boolean(user) &&
    (pathname === dashboardPath ||
      pathname.startsWith("/user/") ||
      pathname.startsWith("/founder/") ||
      pathname.startsWith("/creator/") ||
      pathname.startsWith("/account/"));

  const showDashboardLink = Boolean(user && dashboardPath && !isOnDashboard);

  // Immersive routes render a dark, animated hero. Make the header blend into
  // them (transparent + dark tokens), then solidify into dark glass once scrolled.
  const isLanding = IMMERSIVE_ROUTES.has(pathname);

  useEffect(() => {
    if (!isLanding) {
      setScrolled(false);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isLanding]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-colors duration-300",
        isLanding
          ? scrolled
            ? "dark border-b border-white/10 bg-background/80 backdrop-blur-xl"
            : "dark border-b border-transparent bg-transparent"
          : "border-b bg-background/80 backdrop-blur-xl"
      )}
    >
      <div className="container flex h-14 min-h-14 items-center justify-between gap-2 sm:h-16 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2 lg:flex-none">
          <MobileNav user={user} showDashboard={showDashboardLink} dashboardHref={dashboardPath} />
          <Logo />
        </div>

        <DesktopNav dashboardHref={dashboardPath} showDashboard={showDashboardLink} />

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9 sm:hidden" aria-label="Search">
            <Link href="/search">
              <Search className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className={cn(
              "hidden h-9 sm:inline-flex",
              isLanding && "border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            )}
          >
            <Link href="/search">
              <Search className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Search</span>
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 shrink-0"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {user ? (
            <AccountMenu user={user} />
          ) : (
            <Button asChild size="sm" variant="default" className="hidden h-9 sm:inline-flex">
              <Link href="/auth/login?next=/user/dashboard">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
