"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Search, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { navItems } from "@/lib/constants/navigation";
import { getHomeForRole, getLoginPathForRole, getProfilePathForRole } from "@/lib/auth/portals";
import { getHeaderRoleLabel } from "@/lib/auth/member-roles";
import { isNavActive } from "@/lib/navigation/active-route";
import type { Role } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils/cn";

type MobileNavUser = {
  name: string;
  email: string;
  role: Role;
};

type MobileNavProps = {
  user: MobileNavUser | null;
  showDashboard?: boolean;
  dashboardHref?: string | null;
};

export function MobileNav({ user, showDashboard, dashboardHref }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const dashboardPath = dashboardHref ?? (user ? getHomeForRole(user.role) : null);
  const roleLabel = user ? getHeaderRoleLabel(user.role) : null;

  function close() {
    setOpen(false);
  }

  async function signOut() {
    if (!user) return;
    close();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(getLoginPathForRole(user.role));
    router.refresh();
  }

  const linkClass = (href: string) =>
    cn(
      "flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
      isNavActive(pathname, href) ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-[min(100vw-1rem,320px)] flex-col p-0">
        <SheetHeader className="border-b px-4 py-4 text-left">
          <SheetTitle className="text-base">TheAiStack</SheetTitle>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Mobile">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={close} className={linkClass(item.href)}>
                  <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
            {showDashboard && dashboardPath ? (
              <Link href={dashboardPath} onClick={close} className={linkClass(dashboardPath)}>
                <UserRound className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                Dashboard
              </Link>
            ) : null}
            <Link href="/search" onClick={close} className={linkClass("/search")}>
              <Search className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              Search
            </Link>
          </div>

          <Separator className="my-4" />

          {!user ? (
            <Link
              href="/auth/login?next=/user/dashboard"
              onClick={close}
              className="flex min-h-[44px] items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
            >
              Sign in
            </Link>
          ) : (
            <div className="space-y-3 rounded-lg border bg-muted/40 p-3">
              {roleLabel ? (
                <Badge variant="premium" className="capitalize">
                  {roleLabel}
                </Badge>
              ) : null}
              <div>
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex flex-col gap-1">
                <Link
                  href={getProfilePathForRole(user.role)}
                  onClick={close}
                  className="flex min-h-[44px] items-center gap-2 rounded-md px-2 text-sm hover:bg-secondary"
                >
                  <UserRound className="h-4 w-4" />
                  Edit profile
                </Link>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="flex min-h-[44px] items-center gap-2 rounded-md px-2 text-sm text-destructive hover:bg-secondary"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
