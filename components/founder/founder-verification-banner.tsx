"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { FounderEntitlementsView } from "@/types/founder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function FounderVerificationBanner({
  initialVerified,
  initialEntitlements
}: {
  initialVerified: boolean;
  initialEntitlements: FounderEntitlementsView;
}) {
  const searchParams = useSearchParams();
  const [verified, setVerified] = useState(initialVerified);
  const [entitlements, setEntitlements] = useState(initialEntitlements);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkoutSuccess = searchParams.get("checkout") === "success";
    const sessionId = searchParams.get("session_id");

    if (!checkoutSuccess && !sessionId) {
      return;
    }

    if (checkoutSuccess && verified && !sessionId) {
      return;
    }

    async function syncVerification() {
      const response = await fetch("/api/founder/verification/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId ?? undefined })
      });
      const payload = (await response.json()) as {
        verified?: boolean;
        message?: string;
        entitlements?: FounderEntitlementsView;
      };
      if (response.ok) {
        setVerified(Boolean(payload.verified));
        if (payload.entitlements) {
          setEntitlements(payload.entitlements);
        }
        setMessage(payload.message ?? null);
      }
    }

    void syncVerification();
  }, [searchParams, verified]);

  const claimSummary =
    entitlements.claimLimit === null
      ? `${entitlements.claimsUsed} claimed · unlimited plan`
      : `${entitlements.claimsUsed} / ${entitlements.claimLimit} claims used`;

  return (
    <div className="mb-6 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Founder account</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {verified
              ? `Your founder plan is active on ${entitlements.planName ?? "your subscription"}. ${claimSummary}.`
              : "Complete a founder plan payment to unlock verified founder status and listing tools."}
          </p>
          {message ? <p className="mt-2 text-sm text-green-600 dark:text-green-400">{message}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={verified ? "verified" : "secondary"}>{verified ? "Verified" : "Not verified"}</Badge>
          {!verified ? (
            <Button asChild size="sm">
              <Link href="/pricing">Choose a plan</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

