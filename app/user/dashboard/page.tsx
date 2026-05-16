import { MEMBER_DASHBOARD_ROLES } from "@/lib/auth/member-roles";
import { requireUser } from "@/lib/auth/session";
import { MemberDashboard, memberDashboardMetadata } from "@/components/dashboard/member-dashboard";

export const metadata = memberDashboardMetadata("user");

export default async function UserDashboardPage() {
  const currentUser = await requireUser("/user/dashboard", [...MEMBER_DASHBOARD_ROLES]);

  return <MemberDashboard userId={currentUser.id} role={currentUser.role} copyVariant="user" />;
}
