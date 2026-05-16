import type { Metadata } from "next";
import { UserDashboardLayout } from "@/components/dashboard/user-dashboard-layout";
import type { DashboardCopyVariant } from "@/lib/dashboard/copy";
import { getDashboardCopy } from "@/lib/dashboard/copy";
import { getUserMembershipSummary } from "@/lib/queries/membership";
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
  const [managedTools, entitlements, metrics, membership] = await Promise.all([
    getFounderManagedTools(userId),
    getFounderEntitlements(userId, role),
    getFounderDashboardMetrics(userId),
    getUserMembershipSummary(userId)
  ]);

  return (
    <UserDashboardLayout
      copyVariant={copyVariant}
      entitlements={entitlements}
      initialVerified={entitlements.verified}
      membership={membership}
      metrics={metrics}
      tools={managedTools}
    />
  );
}
