"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CreatorDashboardActions() {
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="grid gap-2">
      <Button asChild variant="outline">
        <Link href="/account/profile">Edit profile</Link>
      </Button>
      <Button onClick={() => setStatus("Review draft created. Open the review composer from any tool profile to finish publishing.")}>Publish review</Button>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}
