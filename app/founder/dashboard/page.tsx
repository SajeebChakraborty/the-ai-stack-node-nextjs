import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/session";
import { getFounderEntitlements } from "@/lib/founders/entitlements";
import { getFounderDashboardMetrics } from "@/lib/queries/founder-analytics";
import { getFounderManagedTools } from "@/lib/queries/tools";
import { FounderMetricCards } from "@/components/founder/founder-metric-cards";
import { FounderVerificationBanner } from "@/components/founder/founder-verification-banner";
import { FounderDashboardActions } from "@/components/founder/founder-dashboard-actions";
import { FounderListingManager } from "@/components/founder/founder-listing-manager";

export const metadata: Metadata = {
  title: "Founder Dashboard",
  description: "Claim listings, manage profiles, reply to reviews, publish updates, run subscriptions, and monitor analytics."
};

export default async function FounderDashboardPage() {
  const currentUser = await requireUser("/founder/dashboard", ["founder"]);
  const [managedTools, entitlements, metrics] = await Promise.all([
    getFounderManagedTools(currentUser.id),
    getFounderEntitlements(currentUser.id, currentUser.role),
    getFounderDashboardMetrics(currentUser.id)
  ]);

  return (
    <div className="section-shell">
      <Suspense fallback={null}>
        <FounderVerificationBanner initialVerified={entitlements.verified} initialEntitlements={entitlements} />
      </Suspense>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Founder dashboard</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal md:text-5xl">Manage your market presence.</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Metrics below come from real directory and profile activity on your claimed listings (last {metrics.periodDays} days).
          </p>
        </div>
        <FounderDashboardActions primaryOnly />
      </div>
      <FounderMetricCards metrics={metrics} />
      <div className="mt-6">
        <FounderListingManager tools={managedTools} entitlements={entitlements} />
      </div>
    </div>
  );
}
