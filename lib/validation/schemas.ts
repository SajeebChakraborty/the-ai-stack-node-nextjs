import { z } from "zod";

export const reviewSchema = z.object({
  toolId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(6).max(120),
  body: z.string().min(40).max(5000),
  mediaAssetIds: z.array(z.string().uuid()).max(6).default([])
});

export const toolSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  tagline: z.string().min(12).max(180),
  description: z.string().min(80).max(5000),
  websiteUrl: z.string().url(),
  affiliateUrl: z.string().url().optional(),
  categoryIds: z.array(z.string().uuid()).min(1),
  pricingModel: z.enum(["free", "freemium", "paid", "usage-based", "enterprise"]),
  startingPrice: z.number().min(0)
});

export const checkoutSchema = z.object({
  planId: z.string().min(2),
  interval: z.enum(["monthly", "yearly"])
});

export const websiteSettingsSchema = z.object({
  title: z.string().min(2).max(80),
  description: z.string().min(40).max(180),
  footer: z.string().max(500),
  maintenanceMode: z.boolean(),
  analyticsProvider: z.enum(["posthog", "plausible"])
});

export const premiumPlanWriteSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(500),
  monthlyPrice: z.number().min(0),
  yearlyPrice: z.number().min(0),
  badge: z.enum(["Popular", "Recommended", "Best Value"]).nullable().optional(),
  features: z.array(z.string().trim().min(1)).min(1),
  limits: z.record(z.union([z.number(), z.string()])).optional(),
  claimedListings: z.union([z.number().int().min(0), z.literal("unlimited")]).optional(),
  enabled: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional()
});

export const stripeSettingsSchema = z.object({
  publishableKey: z.string().max(200).optional(),
  secretKey: z.string().max(200).optional(),
  webhookSecret: z.string().max(200).optional(),
  defaultTaxRateId: z.string().max(120).optional()
});
