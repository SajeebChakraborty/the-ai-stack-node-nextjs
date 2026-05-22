import { NextResponse } from "next/server";
import { getCourseMarketplaceSettings } from "@/lib/marketplace/settings";

export async function GET() {
  try {
    const settings = await getCourseMarketplaceSettings();
    return NextResponse.json({
      platformFeePercent: settings.platformFeePercent,
      automationBuyerFeePercent: settings.automationBuyerFeePercent,
      automationSellerFeePercent: settings.automationSellerFeePercent,
      automationAutoReleaseHours: settings.automationAutoReleaseHours,
      currency: settings.currency,
      minWithdrawalCents: settings.minWithdrawalCents
    });
  } catch {
    return NextResponse.json(
      {
        platformFeePercent: 10,
        automationBuyerFeePercent: 10,
        automationSellerFeePercent: 10,
        automationAutoReleaseHours: 24,
        currency: "usd",
        minWithdrawalCents: 1000
      },
      { status: 200 }
    );
  }
}
