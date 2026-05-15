import { BarChart3, MousePointerClick, SearchCheck, TrendingUp } from "lucide-react";
import type { FounderDashboardMetrics } from "@/lib/queries/founder-analytics";
import { Card, CardContent } from "@/components/ui/card";

function formatNumber(value: number) {
  return value.toLocaleString();
}

export function FounderMetricCards({ metrics }: { metrics: FounderDashboardMetrics }) {
  const cards = [
    {
      icon: BarChart3,
      label: "Directory traffic",
      value: formatNumber(metrics.traffic),
      hint: `Listing views & profile opens (${metrics.periodDays}d)`
    },
    {
      icon: MousePointerClick,
      label: "Outbound clicks",
      value: formatNumber(metrics.outboundClicks),
      hint: `Visit clicks from directory & profiles (${metrics.periodDays}d)`
    },
    {
      icon: TrendingUp,
      label: "Conversion",
      value: `${metrics.conversionRate}%`,
      hint: "Outbound clicks ÷ traffic"
    },
    {
      icon: SearchCheck,
      label: "SEO categories",
      value: formatNumber(metrics.seoKeywords),
      hint: `${metrics.publishedClaims} published claim${metrics.publishedClaims === 1 ? "" : "s"}`
    }
  ] as const;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards.map(({ icon: Icon, label, value, hint }) => (
        <Card key={label}>
          <CardContent className="p-5">
            <Icon className="mb-4 h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="mt-1 text-3xl font-semibold">{value}</div>
            <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
