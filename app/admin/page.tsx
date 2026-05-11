import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getAdminOverview } from "@/lib/queries/admin";
import { AdminConsole } from "@/components/admin/admin-console";

export const metadata: Metadata = {
  title: "Admin Console",
  description: "Enterprise-grade administration for TheAiStack users, tools, reviews, subscriptions, settings, analytics, and launches."
};

export default async function AdminPage() {
  await requireUser("/admin");
  const data = await getAdminOverview();

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="mb-8 rounded-lg border bg-card p-6">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Admin</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal md:text-5xl">TheAiStack operating console.</h1>
        <p className="mt-4 max-w-3xl text-muted-foreground">
          Manage every dynamic website system: users, listings, reviews, creators, plans, Stripe configuration, homepage merchandising, moderation, newsletters, analytics, ads, and launches.
        </p>
      </div>
      <AdminConsole data={data} />
    </div>
  );
}
