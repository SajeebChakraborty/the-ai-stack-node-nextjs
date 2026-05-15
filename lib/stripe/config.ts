import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/db/prisma";
import type { PublicStripeSettings, StripeSettingsRecord } from "@/types/stripe";

export const STRIPE_SETTINGS_KEY = "stripe";

function trim(value: string | undefined | null) {
  return value?.trim() ?? "";
}

export function maskStripeKey(key: string | undefined | null) {
  const value = trim(key);
  if (value.length < 12) {
    return null;
  }

  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

async function readStripeRecord(): Promise<StripeSettingsRecord> {
  try {
    const row = await prisma.websiteSetting.findUnique({
      where: { key: STRIPE_SETTINGS_KEY }
    });

    if (!row?.value || typeof row.value !== "object" || Array.isArray(row.value)) {
      return {};
    }

    return row.value as StripeSettingsRecord;
  } catch {
    return {};
  }
}

function resolveSecretKey(record: StripeSettingsRecord) {
  const fromDatabase = trim(record.secretKey);
  if (fromDatabase) {
    return { secretKey: fromDatabase, source: "database" as const };
  }

  const fromEnvironment = trim(process.env.STRIPE_SECRET_KEY);
  if (fromEnvironment) {
    return { secretKey: fromEnvironment, source: "environment" as const };
  }

  return { secretKey: "", source: "none" as const };
}

export const loadStripeSettings = cache(async () => {
  const record = await readStripeRecord();
  const { secretKey, source } = resolveSecretKey(record);

  const publishableKey = trim(record.publishableKey) || trim(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  const webhookSecret = trim(record.webhookSecret) || trim(process.env.STRIPE_WEBHOOK_SECRET);
  const defaultTaxRateId = trim(record.defaultTaxRateId) || trim(process.env.STRIPE_DEFAULT_TAX_RATE_ID);

  return {
    record,
    secretKey,
    publishableKey,
    webhookSecret,
    defaultTaxRateId,
    source,
    configured: Boolean(secretKey)
  };
});

export async function getPublicStripeSettings(): Promise<PublicStripeSettings> {
  const settings = await loadStripeSettings();

  return {
    publishableKey: settings.publishableKey,
    secretKeyMasked: maskStripeKey(settings.secretKey),
    webhookSecretMasked: maskStripeKey(settings.webhookSecret),
    defaultTaxRateId: settings.defaultTaxRateId,
    configured: settings.configured,
    source: settings.source
  };
}

export async function saveStripeSettings(
  input: Partial<StripeSettingsRecord>,
  updatedBy: string
): Promise<PublicStripeSettings> {
  const existing = await readStripeRecord();
  const next: StripeSettingsRecord = { ...existing };

  if (input.publishableKey !== undefined) {
    next.publishableKey = trim(input.publishableKey);
  }

  if (input.defaultTaxRateId !== undefined) {
    next.defaultTaxRateId = trim(input.defaultTaxRateId);
  }

  if (trim(input.secretKey)) {
    next.secretKey = trim(input.secretKey);
  }

  if (trim(input.webhookSecret)) {
    next.webhookSecret = trim(input.webhookSecret);
  }

  await prisma.websiteSetting.upsert({
    where: { key: STRIPE_SETTINGS_KEY },
    update: {
      value: next,
      updatedBy
    },
    create: {
      key: STRIPE_SETTINGS_KEY,
      value: next,
      updatedBy
    }
  });

  const secretKey = trim(next.secretKey) || trim(process.env.STRIPE_SECRET_KEY);
  const publishableKey = trim(next.publishableKey) || trim(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  const webhookSecret = trim(next.webhookSecret) || trim(process.env.STRIPE_WEBHOOK_SECRET);

  return {
    publishableKey,
    secretKeyMasked: maskStripeKey(secretKey),
    webhookSecretMasked: maskStripeKey(webhookSecret),
    defaultTaxRateId: trim(next.defaultTaxRateId) || trim(process.env.STRIPE_DEFAULT_TAX_RATE_ID),
    configured: Boolean(secretKey),
    source: trim(next.secretKey) ? "database" : secretKey ? "environment" : "none"
  };
}
