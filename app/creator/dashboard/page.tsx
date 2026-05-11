import type { Metadata } from "next";
import { DollarSign, Film, Trophy, Users } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { creators, reviews } from "@/data/catalog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreatorDashboardActions } from "@/components/creator/creator-dashboard-actions";

export const metadata: Metadata = {
  title: "Creator Dashboard",
  description: "Creator earnings, reviews, sponsorships, videos, comparison posts, and reputation badges."
};

export default async function CreatorDashboardPage() {
  await requireUser("/creator/dashboard");
  const creator = creators[0];

  return (
    <div className="section-shell">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Creator economy</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal md:text-5xl">Grow trust, audience, and commission revenue.</h1>
        </div>
        <CreatorDashboardActions />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          [DollarSign, "Earnings", `$${creator.monthlyEarnings.toLocaleString()}`],
          [Users, "Followers", creator.followers.toLocaleString()],
          [Trophy, "Leaderboard rank", `#${creator.rank}`],
          [Film, "Published reviews", String(reviews.length)]
        ].map(([Icon, label, value]) => {
          const DisplayIcon = Icon as typeof DollarSign;
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
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Active sponsorship offers</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {["Agent Week launch video", "AI video stack comparison", "Enterprise governance roundup"].map((offer, index) => (
              <div key={offer} className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <div className="font-medium">{offer}</div>
                  <div className="text-sm text-muted-foreground">Disclosure required · payout ${[4200, 2600, 6100][index]}</div>
                </div>
                <Badge variant="premium">Available</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Reputation badges</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {["Verified YouTube", "High trust reviewer", "Top 1% helpful score", "Affiliate compliant", "AI coding expert"].map((badge) => (
              <Badge key={badge} variant="verified">{badge}</Badge>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
