"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { FounderDashboardChartPoint } from "@/lib/queries/founder-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FounderMetricsChartProps = {
  series: FounderDashboardChartPoint[];
  periodDays: number;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
};

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border/80 bg-card/95 px-3 py-2 text-sm shadow-lg backdrop-blur-sm">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-muted-foreground" style={{ color: entry.color }}>
          {entry.name}: <span className="font-semibold text-foreground">{entry.value?.toLocaleString() ?? 0}</span>
        </p>
      ))}
    </div>
  );
}

export function FounderMetricsChart({ series, periodDays }: FounderMetricsChartProps) {
  const hasActivity = series.some((point) => point.traffic > 0 || point.outboundClicks > 0);

  return (
    <Card className="border-border/80 bg-card/60 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Traffic & clicks over time</CardTitle>
        <p className="text-sm text-muted-foreground">
          Daily directory traffic and outbound clicks on your claimed listings (last {periodDays} days).
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(350 84% 58%)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(350 84% 58%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="outboundGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(210 90% 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(210 90% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={28}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
              />
              <Area
                type="monotone"
                dataKey="traffic"
                name="Directory traffic"
                stroke="hsl(350 84% 58%)"
                fill="url(#trafficGradient)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Area
                type="monotone"
                dataKey="outboundClicks"
                name="Outbound clicks"
                stroke="hsl(210 90% 60%)"
                fill="url(#outboundGradient)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {!hasActivity ? (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            No activity yet — impressions and clicks will appear here as users discover your listings.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
