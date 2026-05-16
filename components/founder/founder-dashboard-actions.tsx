"use client";

import Link from "next/link";
import { useState } from "react";
import type { DashboardCopyVariant } from "@/lib/dashboard/copy";
import { getDashboardCopy } from "@/lib/dashboard/copy";
import { useUserDashboardNav } from "@/lib/dashboard/nav-context";
import { scrollToCreateClaimSection } from "@/lib/founder/claim-section";
import { Button } from "@/components/ui/button";

const founderActions = ["Upload screenshots", "Respond to reviews", "Publish product update", "Manage affiliate links", "Export analytics"];

export function FounderDashboardActions({
  copyVariant = "user",
  primaryOnly = false
}: {
  copyVariant?: DashboardCopyVariant;
  primaryOnly?: boolean;
}) {
  const copy = getDashboardCopy(copyVariant);
  const dashboardNav = useUserDashboardNav();
  const [status, setStatus] = useState<string | null>(null);

  function openClaimCreate() {
    if (dashboardNav) {
      dashboardNav.setView("create");
      return;
    }

    scrollToCreateClaimSection();
  }

  if (primaryOnly) {
    return (
      <div className="grid gap-2">
        <Button type="button" onClick={openClaimCreate}>
          Claim a listing
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button type="button" variant="outline" className="justify-start" onClick={openClaimCreate}>
        Claim a listing
      </Button>
      <Button asChild variant="outline" className="justify-start">
        <Link href="/account/profile">Edit profile</Link>
      </Button>
      {founderActions.map((action) => (
        <Button key={action} variant="outline" className="justify-start" onClick={() => setStatus(`${action} is ready. ${copy.workspaceSaved}`)}>
          {action}
        </Button>
      ))}
      {status ? <p className="md:col-span-2 text-sm text-muted-foreground">{status}</p> : null}
    </>
  );
}
