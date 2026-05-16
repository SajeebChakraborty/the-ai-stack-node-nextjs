import type { Metadata } from "next";
import { Suspense } from "react";
import { FounderMetricCards } from "@/components/founder/founder-metric-cards";
import { FounderVerificationBanner } from "@/components/founder/founder-verification-banner";
import { FounderDashboardActions } from "@/components/founder/founder-dashboard-actions";
import { FounderListingManager } from "@/components/founder/founder-listing-manager";
import type { DashboardCopyVariant } from "@/lib/dashboard/copy";
import { getDashboardCopy } from "@/lib/dashboard/copy";
import { getFounderEntitlements } from "@/lib/founders/entitlements";
import { getFounderDashboardMetrics } from "@/lib/queries/founder-analytics";
import { getFounderManagedTools } from "@/lib/queries/tools";
import type { Role } from "@/types/domain";

type MemberDashboardProps = {
  userId: string;
  role: Role;
  copyVariant: DashboardCopyVariant;
};

export function memberDashboardMetadata(copyVariant: DashboardCopyVariant): Metadata {
  const copy = getDashboardCopy(copyVariant);
  const title = copy.dashboardEyebrow.replace(/\b\w/g, (char) => char.toUpperCase());
  return {
    title,
    description: "Claim listings, manage profiles, reply to reviews, publish updates, run subscriptions, and monitor analytics."
  };
}

export async function MemberDashboard({ userId, role, copyVariant }: MemberDashboardProps) {
  const copy = getDashboardCopy(copyVariant);
  const [managedTools, entitlements, metrics] = await Promise.all([
    getFounderManagedTools(userId),
    getFounderEntitlements(userId, role),
    getFounderDashboardMetrics(userId)
  ]);

  return (
    <div className="section-shell">
      <Suspense fallback={null}>
        <FounderVerificationBanner
          copyVariant={copyVariant}
          initialVerified={entitlements.verified}
          initialEntitlements={entitlements}
        />
      </Suspense>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">{copy.dashboardEyebrow}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal md:text-5xl">Manage your market presence.</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Metrics below come from real directory and profile activity on your claimed listings (last {metrics.periodDays}{" "}
            days).
          </p>
        </div>
        <FounderDashboardActions copyVariant={copyVariant} primaryOnly />
      </div>
      <FounderMetricCards metrics={metrics} />
      <div className="mt-6">
        <FounderListingManager copyVariant={copyVariant} tools={managedTools} entitlements={entitlements} />
      </div>
    </div>
  );
}