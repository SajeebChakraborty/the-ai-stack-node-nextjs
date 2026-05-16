"use client";

import Link from "next/link";
import { Crown } from "lucide-react";
import { PlanActionButton } from "@/components/pricing/plan-action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MembershipSummary } from "@/lib/queries/membership";

type MembershipPanelProps = {
  initialMembership: Pick<MembershipSummary, "currentPlan" | "upgradePlans">;
};

export function MembershipPanel({ initialMembership }: MembershipPanelProps) {
  const { currentPlan, upgradePlans } = initialMembership;

  const statusLabel = currentPlan.subscriptionStatus
    ? currentPlan.subscriptionStatus.replace(/_/g, " ")
    : currentPlan.monthlyPrice > 0
      ? "active"
      : "free tier";

  return (
    <div className="space-y-8">
      <div className="border-b border-border/60 pb-6">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Membership</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Your plan</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
          Current package, billing status, and available upgrades.
        </p>
      </div>

      <Card className="border-border/80 bg-card/50 shadow-none">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Current plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-2xl font-semibold">{currentPlan.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{currentPlan.description}</p>
              <p className="mt-3 text-lg font-medium">
                {currentPlan.monthlyPrice === 0 ? (
                  "Free"
                ) : (
                  <>
                    ${currentPlan.monthlyPrice}
                    <span className="text-sm font-normal text-muted-foreground"> / month</span>
                  </>
                )}
              </p>
            </div>
            <Badge variant={currentPlan.monthlyPrice > 0 ? "verified" : "secondary"} className="capitalize">
              {statusLabel}
            </Badge>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/pricing">View all plans</Link>
          </Button>
        </CardContent>
      </Card>

      {upgradePlans.length > 0 ? (
        <Card className="border-primary/30 bg-primary/5 shadow-none">
          <CardHeader>
            <CardTitle>Upgrade available</CardTitle>
            <p className="text-sm text-muted-foreground">
              Higher tiers than your {currentPlan.name} plan — unlock more claims, analytics, and listing tools.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {upgradePlans.map((plan) => (
              <div key={plan.id} className="rounded-xl border border-border/80 bg-background/60 p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">${plan.monthlyPrice}/month</p>
                  </div>
                  {plan.badge ? <Badge variant="premium">{plan.badge}</Badge> : null}
                </div>
                <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{plan.description}</p>
                <PlanActionButton plan={plan} />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
