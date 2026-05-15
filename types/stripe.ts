export type StripeSettingsRecord = {
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  defaultTaxRateId?: string;
};

export type PublicStripeSettings = {
  publishableKey: string;
  secretKeyMasked: string | null;
  webhookSecretMasked: string | null;
  defaultTaxRateId: string;
  configured: boolean;
  source: "database" | "environment" | "none";
};
