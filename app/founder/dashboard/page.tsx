import type { Metadata } from "next";
import { BarChart3, MousePointerClick, SearchCheck, TrendingUp } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getFounderManagedTools } from "@/lib/queries/tools";
import { tools } from "@/data/catalog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FounderDashboardActions } from "@/components/founder/founder-dashboard-actions";
import { FounderListingManager } from "@/components/founder/founder-listing-manager";

export const metadata: Metadata = {
  title: "Founder Dashboard",
  description: "Claim listings, manage profiles, reply to reviews, publish updates, run subscriptions, and monitor analytics."
};

export default async function FounderDashboardPage() {
  const currentUser = await requireUser("/founder/dashboard", ["founder", "admin"]);
  const managedTools = await getFounderManagedTools(currentUser.id);
  const tool = tools[0];

  return (
    <div className="section-shell">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Founder dashboard</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal md:text-5xl">Manage your market presence.</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">Claim listings, upload media, respond to reviews, publish updates, manage billing, and see the buyer journey.</p>
        </div>
        <FounderDashboardActions primaryOnly />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          [BarChart3, "Traffic", "42,880"],
          [MousePointerClick, "Outbound clicks", "7,142"],
          [TrendingUp, "Conversion", "8.6%"],
          [SearchCheck, "SEO keywords", "328"]
        ].map(([Icon, label, value]) => {
          const DisplayIcon = Icon as typeof BarChart3;
          return (
            <Card key={label as string}>
              <CardContent className="p-5">
                <DisplayIcon className="mb-4 h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">{label as string}</p>
                <div className="mt-1 text-3xl font-semibold">{value as string}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader><CardTitle>{tool.name} profile actions</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <FounderDashboardActions />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Competitor insights</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {tools.slice(1, 4).map((competitor) => (
              <div key={competitor.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="font-medium">{competitor.name}</div>
                  <div className="text-xs text-muted-foreground">{competitor.reviewCount} reviews · {competitor.rating} rating</div>
                </div>
                <Badge variant="secondary">Watch</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="mt-6">
        <FounderListingManager tools={managedTools} />
      </div>
    </div>
  );
}
