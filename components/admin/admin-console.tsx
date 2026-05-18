"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, CreditCard, Eye, Flag, Globe2, LayoutDashboard, Megaphone, Newspaper, ShieldCheck, Star, Users } from "lucide-react";
import type { Awaited } from "@/types/utility";
import type { ListingClaimRequestView } from "@/types/listing-claim-request";
import { getAdminOverview } from "@/lib/queries/admin";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { AdminMemberTable } from "@/components/admin/admin-member-table";
import { AdminBulkClaimPanel } from "@/components/admin/admin-bulk-claim-panel";
import { AdminClaimRequestsPanel } from "@/components/admin/admin-claim-requests-panel";
import { AdminPlansPanel } from "@/components/admin/admin-plans-panel";
import { AdminCoursesPanel } from "@/components/admin/admin-courses-panel";
// import { StripeSettingsForm } from "@/components/admin/stripe-settings-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AdminData = Awaited<ReturnType<typeof getAdminOverview>>;

const adminSections = [
  "Overview",
  "Users",
  "Tools",
  // "Reviews",
  // "Creators",
  "Founders",
  "Subscriptions",
  "Plans",
  "Courses",
  "Bulk Claim",
  "Claim Requests"
  // "Homepage",
  // "Categories",
  // "Moderation",
  // "Newsletter",
  // "Analytics",
  // "Ads",
  // "Launches",
  // "Settings"
];

export function AdminConsole({
  data,
  claimRequests = []
}: {
  data: AdminData;
  claimRequests?: ListingClaimRequestView[];
}) {
  const router = useRouter();
  // const [maintenanceMode, setMaintenanceMode] = useState(data.siteSettings.maintenanceMode);
  const [pendingClaims, setPendingClaims] = useState(data.pendingClaims);

  async function approveClaim(toolId: string) {
    const response = await fetch(`/api/admin/tools/${toolId}/approval`, {
      method: "POST"
    });

    if (response.ok) {
      setPendingClaims((current) => current.filter((claim) => claim.id !== toolId));
      router.refresh();
    }
  }

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
          <p className="mb-4 text-sm text-muted-foreground">
            Live database metrics · last {data.analytics.periodDays} days for traffic and revenue signals
          </p>
          <div className="grid gap-4 md:grid-cols-4">
            {data.metrics.map((metric) => (
              <Card key={metric.label}>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <div className="mt-2 text-3xl font-semibold">{metric.value}</div>
                  <Badge variant="secondary" className="mt-3">
                    {metric.change}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <ManagementCard icon={BarChart3} title="Payment analytics">
              <MetricLine label="Stripe revenue (30d)" value={`$${data.analytics.paymentRevenue.toLocaleString()}`} />
              <MetricLine label="Revenue attributed to creators" value={`$${data.analytics.creatorAttributedRevenue.toLocaleString()}`} />
              <MetricLine label="Outbound conversion rate" value={`${data.analytics.conversionRate}%`} />
              <MetricLine label="Listing & profile traffic" value={data.analytics.traffic.toLocaleString()} />
              <MetricLine label="Outbound clicks" value={data.analytics.outboundClicks.toLocaleString()} />
            </ManagementCard>
            <ManagementCard icon={ShieldCheck} title="Operational queues">
              <MetricLine label="Pending claim approvals" value={String(data.pendingClaims.length)} />
              <MetricLine label="Reviews needing moderation" value={String(data.analytics.reviewsNeedingModeration)} />
              <MetricLine
                label="Active launch campaigns"
                value={String(data.launchCampaigns.filter((campaign) => campaign.status === "active").length)}
              />
              <MetricLine label="Active subscriptions" value={String(data.subscriptions.length)} />
              <MetricLine label="Registered founders" value={String(data.analytics.totalFounders)} />
              <MetricLine label="Registered users" value={String(data.analytics.totalUsers)} />
            </ManagementCard>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-0">
          <div className="grid gap-4">
            <AdminMemberTable
              title="Platform admins"
              description="Admin accounts with full console access."
              members={data.admins}
              allowedRoles={["admin"]}
              verificationMode="none"
            />
            <AdminMemberTable
              title="Connected members"
              description="Registered users and creators with connected social accounts."
              members={data.users}
              allowedRoles={["user", "creator", "moderator", "founder", "admin"]}
              verificationMode="none"
            />
          </div>
        </TabsContent>
        <TabsContent value="tools" className="mt-0">
          <TablePanel title="Manage approved tools" rows={data.tools.map((tool) => [tool.name, tool.pricingModel, tool.verified ? "Verified" : "Unverified", `${tool.reviewCount} reviews`])} />
        </TabsContent>
        {/* <TabsContent value="reviews" className="mt-0">
          <TablePanel title="Manage reviews" rows={data.reviews.map((review) => [review.title, review.type, `${review.rating} stars`, `${review.trustScore} trust`])} />
        </TabsContent> */}
        {/* <TabsContent value="creators" className="mt-0">
          <TablePanel title="Creator leaderboard" rows={data.creators.map((creator) => [`#${creator.rank} ${creator.name}`, creator.niche, `${creator.trustScore} trust`, `$${creator.monthlyEarnings.toLocaleString()}/mo`])} />
        </TabsContent> */}
        <TabsContent value="founders" className="mt-0">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Claim approvals</CardTitle>
                <p className="text-sm text-muted-foreground">Approve founder-created listings before they appear in the public directory.</p>
              </CardHeader>
              <CardContent className="grid gap-3">
                {pendingClaims.length ? (
                  pendingClaims.map((claim) => (
                    <div key={claim.id} className="flex items-center justify-between gap-4 rounded-md border p-4">
                      <div>
                        <div className="font-medium">{claim.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {claim.slug} Â· submitted by {claim.founderName}
                        </div>
                      </div>
                      <AdminActionButton variant="outline" size="sm" doneLabel="Approved" onClick={() => approveClaim(claim.id)}>
                        Approve
                      </AdminActionButton>
                    </div>
                  ))
                ) : (
                  <div className="rounded-md border p-4 text-sm text-muted-foreground">No pending claimed listings right now.</div>
                )}
              </CardContent>
            </Card>
            <AdminMemberTable
              title="Founder accounts"
              description="Founders become verified automatically after a completed plan payment."
              members={data.founders}
              showFounderFields
              verificationMode="founder-payment"
              allowedRoles={["founder", "admin"]}
            />
          </div>
        </TabsContent>
        <TabsContent value="subscriptions" className="mt-0">
          <TablePanel title="Subscription analytics" rows={data.subscriptions.map((sub) => [sub.company, sub.plan, sub.status, `$${sub.mrr}/mo`, sub.renewal])} />
        </TabsContent>
        <TabsContent value="plans" className="mt-0">
          <AdminPlansPanel initialPlans={data.premiumPlans} />
        </TabsContent>
        <TabsContent value="courses" className="mt-0">
          <AdminCoursesPanel />
        </TabsContent>
        <TabsContent value="bulk claim" className="mt-0">
          <AdminBulkClaimPanel />
        </TabsContent>
        <TabsContent value="claim requests" className="mt-0">
          <AdminClaimRequestsPanel initialRequests={claimRequests} />
        </TabsContent>
        {/* <TabsContent value="homepage" className="mt-0">
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
        <TabsContent value="settings" className="mt-0 space-y-4">
          <StripeSettingsForm initial={data.stripeSettings} />
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
        </TabsContent> */}
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
