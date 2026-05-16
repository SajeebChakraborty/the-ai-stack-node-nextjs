import { redirect } from "next/navigation";

/** Legacy founder dashboard URL — canonical member dashboard is /user/dashboard. */
export default function FounderDashboardPage() {
  redirect("/user/dashboard");
}
