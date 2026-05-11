"use client";

import { useMemo, useState } from "react";
import { BarChart3, CreditCard, Edit3, Eye, Flag, Globe2, LayoutDashboard, Megaphone, Newspaper, ShieldCheck, Star, Users } from "lucide-react";
import type { Awaited } from "@/types/utility";
import { getAdminOverview } from "@/lib/queries/admin";
import type { PremiumPlan } from "@/types/domain";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AdminData = Awaited<ReturnType<typeof getAdminOverview>>;

const adminSections = [
  "Overview",
  "Users",
  "Tools",
  "Reviews",
  "Creators",
  "Founders",
  "Subscriptions",
  "Plans",
  "Homepage",
  "Categories",
  "Moderation",
  "Newsletter",
  "Analytics",
  "Ads",
  "Launches",
  "Settings"
];

export function AdminConsole({ data }: { data: AdminData }) {
  const [maintenanceMode, setMaintenanceMode] = useState(data.siteSettings.maintenanceMode);
  const [planQuery, setPlanQuery] = useState("");
  const [plans, setPlans] = useState<PremiumPlan[]>(data.premiumPlans);
  const filteredPlans = useMemo(
    () => plans.filter((plan) => plan.name.toLowerCase().includes(planQuery.toLowerCase())),
    [plans, planQuery]
  );

  return (
    <Tabs defaultValue="overview" className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <TabsList className="sticky top-6 h-fit flex-col items-stretch justify-start bg-transparent p-0">
        {adminSections.map((section) => (
          <TabsTrigger key={section} value={section.toLowerCase()} className="justify-start data-[state=active]:bg-secondary">
            {section}
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="min-w-0">
        <TabsContent value="overview" className="mt-0">
          <div className="grid gap-4 md:grid-cols-4">
            {data.metrics.map((metric) => (
              <Card key={metric.label}>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <div className="mt-2 text-3xl font-semibold">{metric.value}</div>
                  <Badge variant="verified" className="mt-3">{metric.change}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <ManagementCard icon={BarChart3} title="Payment analytics">
              <MetricLine label="Revenue attributed to creators" value={`$${data.analytics.creatorAttributedRevenue.toLocaleString()}`} />
              <MetricLine label="Outbound conversion rate" value={`${data.analytics.conversionRate}%`} />
              <MetricLine label="Tool profile traffic" value={data.analytics.traffic.toLocaleString()} />
            </ManagementCard>
            <ManagementCard icon={ShieldCheck} title="Operational queues">
              <MetricLine label="Reviews needing moderation" value={String(data.reviews.length)} />
              <MetricLine label="Launch campaigns" value={String(data.launchCampaigns.length)} />
              <MetricLine label="Active subscriptions" value={String(data.subscriptions.length)} />
            </ManagementCard>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-0">
          <CrudPanel title="Manage users" description="Roles, trust scores, social verification, notifications, suspension state, and account security." items={["User role matrix", "Connected social accounts", "Trust and credibility score", "Notification preferences"]} />
        </TabsContent>
        <TabsContent value="tools" className="mt-0">
          <TablePanel title="Manage tools" rows={data.tools.map((tool) => [tool.name, tool.pricingModel, tool.verified ? "Verified" : "Unverified", `${tool.reviewCount} reviews`])} />
        </TabsContent>
        <TabsContent value="reviews" className="mt-0">
          <TablePanel title="Manage reviews" rows={data.reviews.map((review) => [review.title, review.type, `${review.rating} stars`, `${review.trustScore} trust`])} />
        </TabsContent>
        <TabsContent value="creators" className="mt-0">
          <TablePanel title="Creator leaderboard" rows={data.creators.map((creator) => [`#${creator.rank} ${creator.name}`, creator.niche, `${creator.trustScore} trust`, `$${creator.monthlyEarnings.toLocaleString()}/mo`])} />
        </TabsContent>
        <TabsContent value="founders" className="mt-0">
          <CrudPanel title="Founder management" description="Claim approvals, company seats, founder verification, listing ownership, and support escalation." items={["Claim requests", "Company profiles", "Founder replies", "Competitor insight access"]} />
        </TabsContent>
        <TabsContent value="subscriptions" className="mt-0">
          <TablePanel title="Subscription analytics" rows={data.subscriptions.map((sub) => [sub.company, sub.plan, sub.status, `$${sub.mrr}/mo`, sub.renewal])} />
        </TabsContent>
        <TabsContent value="plans" className="mt-0">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-4">
              <CardTitle>Premium package management</CardTitle>
              <Button
                onClick={() =>
                  setPlans((current) => [
                    ...current,
                    {
                      id: `custom-${current.length + 1}`,
                      name: `Custom ${current.length + 1}`,
                      description: "Admin-created premium package.",
                      monthlyPrice: 149,
                      yearlyPrice: 1490,
                      badge: "Recommended",
                      features: ["Custom listing limit", "Priority support", "Advanced analytics"],
                      limits: { claimedListings: 10, analyticsDays: 365 },
                      stripeProductId: "prod_custom",
                      stripeMonthlyPriceId: "price_custom_monthly",
                      stripeYearlyPriceId: "price_custom_yearly",
                      enabled: true
                    }
                  ])
                }
              >
                Create plan
              </Button>
            </CardHeader>
            <CardContent>
              <Input placeholder="Search plans" value={planQuery} onChange={(event) => setPlanQuery(event.target.value)} className="mb-4 max-w-sm" />
              <div className="grid gap-3">
                {filteredPlans.map((plan, index) => (
                  <div key={plan.id} className="grid gap-3 rounded-md border p-4 md:grid-cols-[48px_1fr_auto] md:items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">{index + 1}</div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{plan.name}</span>
                        {plan.badge ? <Badge variant="premium">{plan.badge}</Badge> : null}
                        <Badge variant={plan.enabled ? "verified" : "secondary"}>{plan.enabled ? "Enabled" : "Disabled"}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${plan.monthlyPrice}/mo · ${plan.yearlyPrice}/yr · {plan.features.join(", ")}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <AdminActionButton
                        variant="outline"
                        size="sm"
                        doneLabel="Saved"
                        onClick={() =>
                          setPlans((current) =>
                            current.map((item) => (item.id === plan.id ? { ...item, badge: item.badge ? undefined : "Recommended" } : item))
                          )
                        }
                      >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Edit
                      </AdminActionButton>
                      <AdminActionButton
                        variant="ghost"
                        size="sm"
                        doneLabel="Moved"
                        onClick={() =>
                          setPlans((current) => {
                            const index = current.findIndex((item) => item.id === plan.id);
                            if (index <= 0) return current;
                            const next = [...current];
                            [next[index - 1], next[index]] = [next[index], next[index - 1]];
                            return next;
                          })
                        }
                      >
                        Reorder
                      </AdminActionButton>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="homepage" className="mt-0">
          <CrudPanel title="Homepage sections" description="Control hero banners, featured tools, creator spotlight, testimonials, newsletter CTAs, and sponsored placements." items={["Hero banner", "Trending tools", "Featured reviews", "AI news rail"]} />
        </TabsContent>
        <TabsContent value="categories" className="mt-0">
          <TablePanel title="Category management" rows={data.categories.map((category) => [category, "SEO landing enabled", "Ranking enabled", "Featured filters active"])} />
        </TabsContent>
        <TabsContent value="moderation" className="mt-0">
          <CrudPanel title="Discussion moderation" description="Nested comments, vote brigading detection, review abuse reports, and launch campaign compliance." items={["Reported discussions", "Review fraud signals", "Creator disclosures", "Shadowban rules"]} />
        </TabsContent>
        <TabsContent value="newsletter" className="mt-0">
          <CrudPanel title="Newsletter campaigns" description="AI weekly digest, launch notifications, audience segments, sponsorship slots, and UTM reporting." items={["Weekly digest", "Launch alerts", "Sponsor inventory", "Subscriber exports"]} />
        </TabsContent>
        <TabsContent value="analytics" className="mt-0">
          <CrudPanel title="Analytics control center" description="Traffic, clicks, conversion, SEO performance, competitor insights, creator attribution, and revenue analytics." items={["Traffic dashboard", "SEO rankings", "Outbound clicks", "Payment analytics"]} />
        </TabsContent>
        <TabsContent value="ads" className="mt-0">
          <CrudPanel title="Advertisement manager" description="Sponsored listings, newsletter sponsorships, category takeovers, launch video ads, and performance reporting." items={["Sponsored cards", "Homepage banners", "Newsletter sponsors", "Creator campaigns"]} />
        </TabsContent>
        <TabsContent value="launches" className="mt-0">
          <TablePanel title="Launch campaigns" rows={data.launchCampaigns.map((campaign) => [campaign.name, campaign.status, campaign.startsAt, `${campaign.bookedSponsors} sponsors`])} />
        </TabsContent>
        <TabsContent value="settings" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Dynamic website settings</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Input defaultValue={data.siteSettings.title} aria-label="Website title" />
              <Input defaultValue={data.siteSettings.description} aria-label="SEO description" />
              <div className="grid gap-3 rounded-md border p-4 md:grid-cols-2">
                <UploadSetting label="Logo upload" value={data.siteSettings.logoUrl} />
                <UploadSetting label="Favicon upload" value={data.siteSettings.faviconUrl} />
              </div>
              <label className="flex items-center justify-between rounded-md border p-4">
                <span>
                  <span className="block font-medium">Maintenance mode</span>
                  <span className="text-sm text-muted-foreground">Temporarily gate public traffic while admins continue working.</span>
                </span>
                <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
              </label>
              <AdminActionButton className="w-fit" doneLabel="Settings saved">Save settings and refresh cache</AdminActionButton>
            </CardContent>
          </Card>
        </TabsContent>
      </div>
    </Tabs>
  );
}

function ManagementCard({ title, icon: Icon, children }: { title: string; icon: typeof LayoutDashboard; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function CrudPanel({ title, description, items }: { title: string; description: string; items: string[] }) {
  const icons = [Users, Globe2, Flag, Megaphone, CreditCard, Newspaper, Eye, Star];
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {items.map((item, index) => {
          const Icon = icons[index % icons.length];
          return (
            <div key={item} className="flex items-center justify-between rounded-md border p-4">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-primary" />
                <span className="font-medium">{item}</span>
              </div>
              <AdminActionButton variant="outline" size="sm" doneLabel="Opened">Manage</AdminActionButton>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function TablePanel({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <tbody>
            {rows.map((row) => (
              <tr key={row.join("-")} className="border-b last:border-0">
                {row.map((cell) => (
                  <td key={cell} className="py-3 pr-4 text-muted-foreground first:font-medium first:text-foreground">
                    {cell}
                  </td>
                ))}
                <td className="py-3 text-right">
                  <AdminActionButton variant="outline" size="sm" doneLabel="Opened">Manage</AdminActionButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function UploadSetting({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <div className="font-medium">{label}</div>
      <Input defaultValue={value} />
      <p className="text-xs text-muted-foreground">Stored in Supabase Storage with image optimization and cache refresh.</p>
    </div>
  );
}
