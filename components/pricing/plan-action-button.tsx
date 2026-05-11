"use client";

import { useState } from "react";
import { Crown } from "lucide-react";
import type { PremiumPlan } from "@/types/domain";
import { Button } from "@/components/ui/button";

export function PlanActionButton({ plan }: { plan: PremiumPlan }) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startPlan() {
    if (plan.monthlyPrice === 0) {
      window.location.href = "/auth/login?next=/directory";
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, interval: "monthly" })
      });

      const data = (await response.json().catch(() => ({ error: "Checkout response was not available." }))) as { url?: string; error?: string };
      if (response.status === 401) {
        window.location.href = `/auth/login?next=${encodeURIComponent("/pricing")}`;
        return;
      }
      if (!response.ok || !data.url) {
        setStatus(typeof data.error === "string" ? data.error : "Stripe checkout is ready once billing keys are configured.");
        return;
      }
      window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Button className="w-full" variant={plan.badge ? "default" : "outline"} onClick={startPlan} disabled={loading}>
        <Crown className="mr-2 h-4 w-4" />
        {loading ? "Opening checkout..." : plan.monthlyPrice === 0 ? "Start free" : "Upgrade"}
      </Button>
      {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
    </div>
  );
}
