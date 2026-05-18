"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import type { Role } from "@/types/domain";
import { getHeaderRoleLabel } from "@/lib/auth/member-roles";
import { getLoginPathForRole, getProfilePathForRole } from "@/lib/auth/portals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

type AccountMenuUser = {
  name: string;
  email: string;
  role: Role;
};

export function AccountMenu({ user }: { user: AccountMenuUser }) {
  const router = useRouter();
  const profilePath = getProfilePathForRole(user.role);
  const roleLabel = getHeaderRoleLabel(user.role);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(getLoginPathForRole(user.role));
    router.refresh();
  }

  return (
    <>
      <div className="lg:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" aria-label="Account menu">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-2">
              {roleLabel ? (
                <Badge variant="premium" className="mb-2 capitalize">
                  {roleLabel}
                </Badge>
              ) : null}
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={profilePath} className="cursor-pointer">
                <UserRound className="mr-2 h-4 w-4" />
                Edit profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => void signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="hidden items-center gap-2 lg:flex xl:gap-3">
        <div className="max-w-[180px] text-right text-xs xl:max-w-[240px]">
          {roleLabel ? (
            <div className="mb-1 flex justify-end">
              <Badge variant="premium" className="capitalize">
                {roleLabel}
              </Badge>
            </div>
          ) : null}
          <div className="truncate font-medium text-foreground">{user.name}</div>
          <div className="hidden truncate text-muted-foreground xl:block">{user.email}</div>
        </div>
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <Link href={profilePath}>
            <UserRound className="mr-2 h-4 w-4" />
            <span className="hidden xl:inline">Edit profile</span>
            <span className="xl:hidden">Profile</span>
          </Link>
        </Button>
        <Button size="sm" variant="ghost" className="shrink-0" onClick={() => void signOut()}>
          <LogOut className="h-4 w-4 xl:mr-2" />
          <span className="hidden xl:inline">Sign out</span>
        </Button>
      </div>
    </>
  );
}
