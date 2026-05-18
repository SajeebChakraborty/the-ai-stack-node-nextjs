"use client";

import { Suspense, useEffect, useState } from "react";
import { Bookmark, BookOpen, Crown, FileText, LayoutDashboard, ListChecks, PlusCircle } from "lucide-react";
import { MyCoursesPanel } from "@/components/dashboard/my-courses-panel";
import type { CourseEnrollmentSummary } from "@/types/course";
import { BookmarksPanel } from "@/components/dashboard/bookmarks-panel";
import { ClaimRequestsPanel } from "@/components/dashboard/claim-requests-panel";
import { MembershipPanel } from "@/components/dashboard/membership-panel";
import { FounderMetricCards } from "@/components/founder/founder-metric-cards";
import { FounderMetricsChart } from "@/components/founder/founder-metrics-chart";
import { FounderVerificationBanner } from "@/components/founder/founder-verification-banner";
import { FounderDashboardActions } from "@/components/founder/founder-dashboard-actions";
import { FounderListingManager } from "@/components/founder/founder-listing-manager";
import type { DashboardCopyVariant } from "@/lib/dashboard/copy";
import { getDashboardCopy } from "@/lib/dashboard/copy";
import { CREATE_CLAIM_SECTION_ID } from "@/lib/founder/claim-section";
import { UserDashboardNavContext, type UserDashboardView } from "@/lib/dashboard/nav-context";
import type { MembershipSummary } from "@/lib/queries/membership";
import type { ListingClaimRequestView } from "@/types/listing-claim-request";
import type { FounderEntitlementsView } from "@/types/founder";
import type { FounderDashboardMetrics } from "@/lib/queries/founder-analytics";
import type { FounderManagedTool } from "@/lib/queries/tools";
import { cn } from "@/lib/utils/cn";

const navItems: Array<{
  id: UserDashboardView;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
}> = [
  {
    id: "my-courses",
    label: "My courses",
    description: "Enrollments, progress & certificates",
    icon: BookOpen
  },
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Traffic, clicks, and performance",
    icon: LayoutDashboard
  },
  {
    id: "create",
    label: "Claim create",
    description: "Submit a new listing claim",
    icon: PlusCircle
  },
  {
    id: "list",
    label: "Claim list",
    description: "Manage claimed listings",
    icon: ListChecks
  },
  {
    id: "membership",
    label: "Membership",
    description: "Current plan & upgrades",
    icon: Crown
  },
  {
    id: "bookmarks",
    label: "Bookmarks",
    description: "Saved directory listings",
    icon: Bookmark
  },
  {
    id: "claim-requests",
    label: "Claim requests",
    description: "Pending listing claims",
    icon: FileText
  }
];

type UserDashboardLayoutProps = {
  copyVariant: DashboardCopyVariant;
  metrics: FounderDashboardMetrics;
  tools: FounderManagedTool[];
  entitlements: FounderEntitlementsView;
  initialVerified: boolean;
  membership: MembershipSummary;
  claimRequests: ListingClaimRequestView[];
  courseEnrollments: CourseEnrollmentSummary[];
};

export function UserDashboardLayout({
  copyVariant,
  metrics,
  tools,
  entitlements,
  initialVerified,
  membership,
  claimRequests,
  courseEnrollments
}: UserDashboardLayoutProps) {
  const copy = getDashboardCopy(copyVariant);
  const [activeView, setActiveView] = useState<UserDashboardView>("my-courses");

  useEffect(() => {
    if (window.location.hash === `#${CREATE_CLAIM_SECTION_ID}`) {
      setActiveView("create");
    }
  }, []);

  return (
    <div className="section-shell !py-8 md:!py-10">
      <Suspense fallback={null}>
        <FounderVerificationBanner
          copyVariant={copyVariant}
          initialVerified={initialVerified}
          initialEntitlements={entitlements}
        />
      </Suspense>

      <UserDashboardNavContext.Provider value={{ setView: setActiveView }}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <aside className="lg:w-72 lg:shrink-0">
            <div className="glass-panel rounded-2xl p-2 lg:sticky lg:top-24">
              <p className="px-3 pb-2 pt-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Workspace
              </p>
              <nav className="flex flex-row gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveView(item.id)}
                      className={cn(
                        "flex min-w-[10.5rem] shrink-0 items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors lg:min-w-0 lg:w-full",
                        isActive
                          ? "border-primary/40 bg-primary/10 shadow-sm"
                          : "border-transparent hover:border-border hover:bg-muted/50"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                          isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{item.label}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{item.description}</span>
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            <div className="glass-panel min-h-[28rem] rounded-2xl p-5 md:p-8">
              {activeView === "dashboard" ? (
                <div className="space-y-8">
                  <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-6">
                    <div>
                      <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">{copy.dashboardEyebrow}</p>
                      <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Manage your market presence</h1>
                      <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
                        Metrics from directory and profile activity on your claimed listings (last {metrics.periodDays} days).
                      </p>
                    </div>
                    <FounderDashboardActions copyVariant={copyVariant} primaryOnly />
                  </div>
                  <FounderMetricCards metrics={metrics} />
                  <FounderMetricsChart periodDays={metrics.periodDays} series={metrics.chartSeries} />
                </div>
              ) : activeView === "my-courses" ? (
                <MyCoursesPanel enrollments={courseEnrollments} />
              ) : activeView === "membership" ? (
                <MembershipPanel initialMembership={membership} />
              ) : activeView === "bookmarks" ? (
                <BookmarksPanel initialBookmarks={membership.bookmarks} />
              ) : activeView === "claim-requests" ? (
                <ClaimRequestsPanel initialRequests={claimRequests} />
              ) : (
                <FounderListingManager
                  copyVariant={copyVariant}
                  entitlements={entitlements}
                  section={activeView}
                  tools={tools}
                />
              )}
            </div>
          </main>
        </div>
      </UserDashboardNavContext.Provider>
    </div>
  );
}
