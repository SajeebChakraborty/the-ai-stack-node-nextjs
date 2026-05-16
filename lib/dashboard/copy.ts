export type DashboardCopyVariant = "user" | "founder";

export type DashboardCopy = {
  accountEyebrow: string;
  accountVerifiedPlan: (planName: string, claimSummary: string) => string;
  accountUnverified: string;
  dashboardEyebrow: string;
  notVerifiedClaimMessage: string;
  emptyListings: string;
  publishUpdateLabel: string;
  publishingUpdate: string;
  updateFailed: string;
  updatePublished: string;
  workspaceSaved: string;
};

const DASHBOARD_COPY: Record<DashboardCopyVariant, DashboardCopy> = {
  user: {
    accountEyebrow: "User account",
    accountVerifiedPlan: (planName, claimSummary) =>
      `Your user plan is active on ${planName}. ${claimSummary}.`,
    accountUnverified: "Complete a user plan payment to unlock verified user status and listing tools.",
    dashboardEyebrow: "User dashboard",
    notVerifiedClaimMessage: "Complete a user plan payment to become verified before claiming listings.",
    emptyListings: "No listings are claimed on this user account yet.",
    publishUpdateLabel: "Publish user update",
    publishingUpdate: "Publishing user update...",
    updateFailed: "User update failed.",
    updatePublished: "User update published.",
    workspaceSaved: "Changes are saved to the user workspace in this session."
  },
  founder: {
    accountEyebrow: "Founder account",
    accountVerifiedPlan: (planName, claimSummary) =>
      `Your founder plan is active on ${planName}. ${claimSummary}.`,
    accountUnverified: "Complete a founder plan payment to unlock verified founder status and listing tools.",
    dashboardEyebrow: "Founder dashboard",
    notVerifiedClaimMessage: "Complete a founder plan payment to become verified before claiming listings.",
    emptyListings: "No listings are claimed on this founder account yet.",
    publishUpdateLabel: "Publish founder update",
    publishingUpdate: "Publishing founder update...",
    updateFailed: "Founder update failed.",
    updatePublished: "Founder update published.",
    workspaceSaved: "Changes are saved to the founder workspace in this session."
  }
};

export function getDashboardCopy(variant: DashboardCopyVariant = "user") {
  return DASHBOARD_COPY[variant];
}
