"use client";

import Link from "next/link";
import { useState } from "react";
import { scrollToCreateClaimSection } from "@/lib/founder/claim-section";
import { Button } from "@/components/ui/button";

const founderActions = ["Upload screenshots", "Respond to reviews", "Publish product update", "Manage affiliate links", "Export analytics"];

export function FounderDashboardActions({ primaryOnly = false }: { primaryOnly?: boolean }) {
  const [status, setStatus] = useState<string | null>(null);

  if (primaryOnly) {
    return (
      <div className="grid gap-2">
        <Button type="button" onClick={scrollToCreateClaimSection}>
          Claim a listing
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button type="button" variant="outline" className="justify-start" onClick={scrollToCreateClaimSection}>
        Claim a listing
      </Button>
      <Button asChild variant="outline" className="justify-start">
        <Link href="/founder/profile">Edit profile</Link>
      </Button>
      {founderActions.map((action) => (
        <Button key={action} variant="outline" className="justify-start" onClick={() => setStatus(`${action} is ready. Changes are saved to the founder workspace in this session.`)}>
          {action}
        </Button>
      ))}
      {status ? <p className="md:col-span-2 text-sm text-muted-foreground">{status}</p> : null}
    </>
  );
}
