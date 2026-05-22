import "server-only";

import { prisma } from "@/lib/db/prisma";

export const COURSE_MARKETPLACE_SETTINGS_KEY = "course_marketplace";

export type CourseMarketplaceSettings = {
  platformFeePercent: number;
  minWithdrawalCents: number;
  currency: string;
  automationSellerFeePercent: number;
  automationBuyerFeePercent: number;
  automationAutoReleaseHours: number;
};

export const DEFAULT_COURSE_MARKETPLACE_SETTINGS: CourseMarketplaceSettings = {
  platformFeePercent: 10,
  minWithdrawalCents: 1000,
  currency: "usd",
  automationSellerFeePercent: 10,
  automationBuyerFeePercent: 10,
  automationAutoReleaseHours: 24
};

function coerceNumber(value: unknown, fallback: number, options?: { min?: number; max?: number }): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  let result = num;
  if (options?.min !== undefined) result = Math.max(options.min, result);
  if (options?.max !== undefined) result = Math.min(options.max, result);
  return result;
}

function coerceCurrency(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(trimmed)) return fallback;
  return trimmed;
}

export async function getCourseMarketplaceSettings(): Promise<CourseMarketplaceSettings> {
  try {
    const row = await prisma.websiteSetting.findUnique({
      where: { key: COURSE_MARKETPLACE_SETTINGS_KEY }
    });

    if (!row?.value || typeof row.value !== "object" || Array.isArray(row.value)) {
      return DEFAULT_COURSE_MARKETPLACE_SETTINGS;
    }

    const raw = row.value as Record<string, unknown>;
    return {
      platformFeePercent: coerceNumber(raw.platformFeePercent, DEFAULT_COURSE_MARKETPLACE_SETTINGS.platformFeePercent, {
        min: 0,
        max: 50
      }),
      minWithdrawalCents: Math.round(
        coerceNumber(raw.minWithdrawalCents, DEFAULT_COURSE_MARKETPLACE_SETTINGS.minWithdrawalCents, { min: 0 })
      ),
      currency: coerceCurrency(raw.currency, DEFAULT_COURSE_MARKETPLACE_SETTINGS.currency),
      automationSellerFeePercent: coerceNumber(
        raw.automationSellerFeePercent,
        DEFAULT_COURSE_MARKETPLACE_SETTINGS.automationSellerFeePercent,
        { min: 0, max: 50 }
      ),
      automationBuyerFeePercent: coerceNumber(
        raw.automationBuyerFeePercent,
        DEFAULT_COURSE_MARKETPLACE_SETTINGS.automationBuyerFeePercent,
        { min: 0, max: 50 }
      ),
      automationAutoReleaseHours: Math.round(
        coerceNumber(raw.automationAutoReleaseHours, DEFAULT_COURSE_MARKETPLACE_SETTINGS.automationAutoReleaseHours, {
          min: 0,
          max: 720
        })
      )
    };
  } catch {
    return DEFAULT_COURSE_MARKETPLACE_SETTINGS;
  }
}

export async function saveCourseMarketplaceSettings(
  input: Partial<CourseMarketplaceSettings>,
  updatedBy?: string
): Promise<CourseMarketplaceSettings> {
  const current = await getCourseMarketplaceSettings();
  const merged: CourseMarketplaceSettings = {
    platformFeePercent:
      input.platformFeePercent !== undefined
        ? coerceNumber(input.platformFeePercent, current.platformFeePercent, { min: 0, max: 50 })
        : current.platformFeePercent,
    minWithdrawalCents:
      input.minWithdrawalCents !== undefined
        ? Math.round(coerceNumber(input.minWithdrawalCents, current.minWithdrawalCents, { min: 0 }))
        : current.minWithdrawalCents,
    currency: input.currency !== undefined ? coerceCurrency(input.currency, current.currency) : current.currency,
    automationSellerFeePercent:
      input.automationSellerFeePercent !== undefined
        ? coerceNumber(input.automationSellerFeePercent, current.automationSellerFeePercent, { min: 0, max: 50 })
        : current.automationSellerFeePercent,
    automationBuyerFeePercent:
      input.automationBuyerFeePercent !== undefined
        ? coerceNumber(input.automationBuyerFeePercent, current.automationBuyerFeePercent, { min: 0, max: 50 })
        : current.automationBuyerFeePercent,
    automationAutoReleaseHours:
      input.automationAutoReleaseHours !== undefined
        ? Math.round(
            coerceNumber(input.automationAutoReleaseHours, current.automationAutoReleaseHours, { min: 0, max: 720 })
          )
        : current.automationAutoReleaseHours
  };

  await prisma.websiteSetting.upsert({
    where: { key: COURSE_MARKETPLACE_SETTINGS_KEY },
    update: { value: merged, updatedBy: updatedBy ?? null },
    create: { key: COURSE_MARKETPLACE_SETTINGS_KEY, value: merged, updatedBy: updatedBy ?? null }
  });

  return merged;
}

/**
 * Split a sale into the creator's earning and the platform's fee, rounding
 * the fee down so the creator never loses sub-cent fractions.
 */
export function splitCoursePurchase(amountCents: number, platformFeePercent: number) {
  const safeAmount = Math.max(0, Math.round(amountCents));
  const safePercent = Math.max(0, Math.min(50, platformFeePercent));
  const platformFeeCents = Math.floor((safeAmount * safePercent) / 100);
  const creatorEarningCents = safeAmount - platformFeeCents;
  return { platformFeeCents, creatorEarningCents };
}

/**
 * Compute the full fee breakdown for an automation purchase.
 *
 * The buyer pays `priceCents + buyerFee`. After escrow release, the seller
 * receives `priceCents - sellerFee`. The platform keeps both fees.
 *
 * Example: price $100, buyer fee 10%, seller fee 10% →
 *   buyer pays $110, seller earns $90, platform keeps $20.
 */
export function calculateAutomationFees(
  basePriceCents: number,
  buyerFeePercent: number,
  sellerFeePercent: number
) {
  const price = Math.max(0, Math.round(basePriceCents));
  const safeBuyer = Math.max(0, Math.min(50, buyerFeePercent));
  const safeSeller = Math.max(0, Math.min(50, sellerFeePercent));

  const buyerFeeCents = Math.round((price * safeBuyer) / 100);
  const sellerFeeCents = Math.round((price * safeSeller) / 100);
  const amountCents = price + buyerFeeCents;
  const sellerEarningCents = Math.max(0, price - sellerFeeCents);
  const platformTotalCents = buyerFeeCents + sellerFeeCents;

  return {
    basePriceCents: price,
    buyerFeeCents,
    sellerFeeCents,
    amountCents,
    sellerEarningCents,
    platformTotalCents
  };
}
