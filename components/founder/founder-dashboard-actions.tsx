"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const founderActions = ["Edit profile", "Upload screenshots", "Respond to reviews", "Publish product update", "Manage affiliate links", "Export analytics"];

export function FounderDashboardActions({ primaryOnly = false }: { primaryOnly?: boolean }) {
  const [status, setStatus] = useState<string | null>(null);

  if (primaryOnly) {
    return (
      <div className="grid gap-2">
        <Button onClick={() => setStatus("Claim request started. The admin team can verify ownership from the admin console.")}>Claim a listing</Button>
        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      </div>
    );
  }

  return (
    <>
      {founderActions.map((action) => (
        <Button key={action} variant="outline" className="justify-start" onClick={() => setStatus(`${action} is ready. Changes are saved to the founder workspace in this session.`)}>
          {action}
        </Button>
      ))}
      {status ? <p className="md:col-span-2 text-sm text-muted-foreground">{status}</p> : null}
    </>
  );
}
