"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { useState } from "react";
import { navItems } from "@/lib/constants/navigation";
import { getHomeForRole } from "@/lib/auth/portals";
import type { Role } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils/cn";

type MobileNavProps = {
  user: { name: string; role: Role } | null;
};

export function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const dashboardPath = user ? getHomeForRole(user.role) : null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(100vw-2rem,320px)]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "rounded-md px-3 py-3 text-sm font-medium transition-colors hover:bg-secondary",
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
          {dashboardPath ? (
            <Link
              href={dashboardPath}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary"
            >
              Dashboard
            </Link>
          ) : null}
          <Link
            href="/search"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-md px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary"
          >
            <Search className="h-4 w-4" />
            Search
          </Link>
          {!user ? (
            <Link
              href="/auth/login?next=/user/dashboard"
              onClick={() => setOpen(false)}
              className="mt-4 rounded-md bg-primary px-3 py-3 text-center text-sm font-medium text-primary-foreground"
            >
              Sign in
            </Link>
          ) : null}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
