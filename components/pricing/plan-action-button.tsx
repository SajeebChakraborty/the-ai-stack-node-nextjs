"use client";

import { useState } from "react";
import { Crown } from "lucide-react";
import type { PremiumPlan } from "@/types/domain";
import { Button } from "@/components/ui/button";

function readCheckoutError(error: unknown, status: number) {
  if (typeof error === "string" && error.length > 0) {
    return error;
  }

  if (error && typeof error === "object") {
    const formErrors = "formErrors" in error && Array.isArray(error.formErrors) ? error.formErrors : [];
    if (formErrors.length > 0) {
      return formErrors.join(" ");
    }
  }

  if (status === 404) {
    return "This plan is not synced to Stripe yet. Ask an admin to run Sync all to Stripe.";
  }

  if (status === 503) {
    return "Billing is not configured yet. Add Stripe keys in Admin → Settings.";
  }

  return "Checkout could not be started. Try again or contact support.";
}

export function PlanActionButton({ plan }: { plan: PremiumPlan }) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startPlan() {
    if (plan.monthlyPrice === 0) {
      window.location.href = "/auth/login?next=/user/dashboard";
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

      const data = (await response.json().catch(() => ({ error: "Checkout response was not available." }))) as {
        url?: string;
        error?: string | { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
      };
      if (response.status === 401) {
        window.location.href = `/auth/login?next=${encodeURIComponent("/pricing")}`;
        return;
      }
      if (!response.ok || !data.url) {
        setStatus(readCheckoutError(data.error, response.status));
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
