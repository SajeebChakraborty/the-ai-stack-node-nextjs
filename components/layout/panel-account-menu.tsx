"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import type { Role } from "@/types/domain";
import { getHeaderRoleLabel } from "@/lib/auth/member-roles";
import { getLoginPathForRole, getProfilePathForRole } from "@/lib/auth/portals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type PanelUser = {
  name: string;
  email: string;
  role: Role;
};

export function PanelAccountMenu({ user, compact = false }: { user: PanelUser; compact?: boolean }) {
  const router = useRouter();
  const profilePath = getProfilePathForRole(user.role);
  const roleLabel = getHeaderRoleLabel(user.role);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(getLoginPathForRole(user.role));
    router.refresh();
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={profilePath}>
            <UserRound className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </Button>
        <Button size="sm" variant="ghost" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="max-w-[240px] text-right text-xs">
        {roleLabel ? (
          <div className="mb-1 flex justify-end">
            <Badge variant="premium" className="capitalize">
              {roleLabel}
            </Badge>
          </div>
        ) : null}
        <div className="truncate font-medium text-foreground">{user.name}</div>
        <div className="truncate text-muted-foreground">{user.email}</div>
      </div>
      <Button asChild size="sm" variant="outline">
        <Link href={profilePath}>
          <UserRound className="mr-2 h-4 w-4" />
          Edit profile
        </Link>
      </Button>
      <Button size="sm" variant="ghost" onClick={signOut}>
        <LogOut className="mr-2 h-4 w-4" />
        Sign out
      </Button>
    </div>
  );
}
