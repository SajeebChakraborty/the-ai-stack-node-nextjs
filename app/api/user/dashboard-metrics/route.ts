import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getFounderDashboardMetrics } from "@/lib/queries/founder-analytics";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const metrics = await getFounderDashboardMetrics(user.id);
    return NextResponse.json({
      traffic: metrics.traffic,
      outboundClicks: metrics.outboundClicks,
      conversionRate: metrics.conversionRate,
      seoKeywords: metrics.seoKeywords,
      publishedClaims: metrics.publishedClaims,
      periodDays: metrics.periodDays,
      chartSeries: metrics.chartSeries
    });
  } catch {
    return NextResponse.json({ error: "Could not load dashboard metrics." }, { status: 503 });
  }
}
