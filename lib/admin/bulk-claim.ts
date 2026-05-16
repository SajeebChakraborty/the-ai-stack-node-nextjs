import "server-only";

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { parseListInput } from "@/lib/tools/media";
import { createFounderClaimedListing } from "@/lib/tools/claiming";
import type { PricingModel } from "@/types/domain";

import { BULK_CLAIM_HEADERS, type BulkClaimHeader } from "@/lib/admin/bulk-claim-columns";

export { BULK_CLAIM_HEADERS, type BulkClaimHeader };

const pricingModels = ["free", "freemium", "paid", "usage-based", "enterprise"] as const;

const bulkClaimRowSchema = z.object({
  user_id: z.string().trim().optional().default(""),
  founder_id: z.string().trim().optional().default(""),
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug must use lowercase letters, numbers, and hyphens."),
  tagline: z.string().trim().min(4).max(160),
  description: z.string().trim().min(20),
  website_url: z.string().trim().url(),
  affiliate_url: z.string().trim().optional().default(""),
  logo_url: z.string().trim().optional().default(""),
  categories: z.string().trim().min(1),
  features: z.string().trim().optional().default(""),
  pricing_model: z.enum(pricingModels),
  starting_price: z.coerce.number().min(0),
  screenshot_urls: z.string().trim().optional().default(""),
  promo_video_url: z.string().trim().optional().default(""),
  video_urls: z.string().trim().optional().default(""),
  social_x: z.string().trim().optional().default(""),
  social_linkedin: z.string().trim().optional().default(""),
  social_youtube: z.string().trim().optional().default(""),
  social_discord: z.string().trim().optional().default("")
});

export type BulkClaimRowInput = z.infer<typeof bulkClaimRowSchema>;

export type BulkClaimImportResult = {
  created: Array<{ row: number; slug: string; name: string }>;
  failed: Array<{ row: number; error: string }>;
};

function normalizeHeaderKey(key: string) {
  return key
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function splitMultiValue(value: string) {
  if (!value.trim()) {
    return [];
  }

  if (value.includes("|")) {
    return value
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return parseListInput(value);
}

function optionalUrl(value: string) {
  const trimmed = value.trim();
  return trimmed && z.string().url().safeParse(trimmed).success ? trimmed : undefined;
}

export function normalizeBulkClaimRow(raw: Record<string, unknown>): Record<string, string> {
  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(raw)) {
    const header = normalizeHeaderKey(key);
    if (!header) {
      continue;
    }

    normalized[header] = value === null || value === undefined ? "" : String(value).trim();
  }

  return normalized;
}

export async function resolveBulkClaimFounderId(row: Pick<BulkClaimRowInput, "user_id" | "founder_id">) {
  const founderId = row.founder_id.trim();
  if (founderId) {
    const profile = await prisma.profile.findUnique({
      where: { id: founderId },
      select: { id: true }
    });
    if (!profile) {
      throw new Error(`founder_id not found: ${founderId}`);
    }
    return profile.id;
  }

  const userId = row.user_id.trim();
  if (userId) {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { id: true }
    });
    if (!profile) {
      throw new Error(`user_id not found: ${userId}`);
    }
    return profile.id;
  }

  return null;
}

export function countBulkClaimDataRows(rows: Record<string, unknown>[]) {
  return rows.filter((row) => {
    const normalized = normalizeBulkClaimRow(row);
    return Boolean(normalized.name || normalized.slug || normalized.website_url);
  }).length;
}

export async function importBulkClaimRow(
  rawRow: Record<string, unknown>,
  rowNumber: number
): Promise<
  | { ok: true; created: { row: number; slug: string; name: string } }
  | { ok: false; failed: { row: number; error: string } }
  | { ok: false; skipped: true }
> {
  const normalized = normalizeBulkClaimRow(rawRow);

  if (!normalized.name && !normalized.slug && !normalized.website_url) {
    return { ok: false, skipped: true };
  }

  const parsed = bulkClaimRowSchema.safeParse(normalized);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join(" ");
    return { ok: false, failed: { row: rowNumber, error: message } };
  }

  try {
    const founderId = await resolveBulkClaimFounderId(parsed.data);
    const tool = await createFounderClaimedListing({
      affiliateUrl: optionalUrl(parsed.data.affiliate_url),
      categories: splitMultiValue(parsed.data.categories),
      description: parsed.data.description,
      features: splitMultiValue(parsed.data.features),
      founderId,
      logoUrl: optionalUrl(parsed.data.logo_url),
      name: parsed.data.name,
      pricingModel: parsed.data.pricing_model as PricingModel,
      screenshotUrls: splitMultiValue(parsed.data.screenshot_urls),
      slug: parsed.data.slug,
      socialLinks: {
        x: optionalUrl(parsed.data.social_x),
        linkedin: optionalUrl(parsed.data.social_linkedin),
        youtube: optionalUrl(parsed.data.social_youtube),
        discord: optionalUrl(parsed.data.social_discord)
      },
      startingPrice: parsed.data.starting_price,
      tagline: parsed.data.tagline,
      promoVideoUrl: optionalUrl(parsed.data.promo_video_url),
      videoUrls: splitMultiValue(parsed.data.video_urls),
      websiteUrl: parsed.data.website_url,
      autoApprove: true
    });

    return { ok: true, created: { row: rowNumber, slug: tool.slug, name: tool.name } };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message === "LISTING_ALREADY_CLAIMED"
          ? "Slug already exists."
          : error.message
        : "Could not create listing.";
    return { ok: false, failed: { row: rowNumber, error: message } };
  }
}

export async function importBulkClaims(rows: Record<string, unknown>[]): Promise<BulkClaimImportResult> {
  const result: BulkClaimImportResult = { created: [], failed: [] };

  for (let index = 0; index < rows.length; index += 1) {
    const rowNumber = index + 2;
    const outcome = await importBulkClaimRow(rows[index] ?? {}, rowNumber);

    if ("skipped" in outcome && outcome.skipped) {
      continue;
    }

    if (outcome.ok) {
      result.created.push(outcome.created);
    } else if ("failed" in outcome) {
      result.failed.push(outcome.failed);
    }
  }

  return result;
}

export const BULK_CLAIM_SAMPLE_ROWS: Array<Record<BulkClaimHeader, string>> = [
  {
    user_id: "",
    founder_id: "",
    name: "StackPilot",
    slug: "stackpilot",
    tagline: "Ship AI workflows faster",
    description:
      "StackPilot helps product teams design, test, and deploy AI agent workflows with guardrails, analytics, and team collaboration built in.",
    website_url: "https://stackpilot.example.com",
    affiliate_url: "https://stackpilot.example.com/?ref=theaistack",
    logo_url: "https://logoipsum.com/artwork/428.png",
    categories: "Productivity, AI agents",
    features: "Workflow builder|Team permissions|Usage analytics",
    pricing_model: "freemium",
    starting_price: "29",
    screenshot_urls: "https://logoipsum.com/artwork/371.png|https://logoipsum.com/artwork/372.png",
    promo_video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    video_urls: "",
    social_x: "https://x.com/stackpilot",
    social_linkedin: "https://linkedin.com/company/stackpilot",
    social_youtube: "",
    social_discord: ""
  },
  {
    user_id: "",
    founder_id: "",
    name: "ClipNova",
    slug: "clipnova",
    tagline: "Turn long videos into shorts",
    description:
      "ClipNova uses AI to find highlight moments, generate captions, and publish short-form clips across social channels in minutes.",
    website_url: "https://clipnova.example.com",
    affiliate_url: "",
    logo_url: "https://logoipsum.com/artwork/429.png",
    categories: "Video, Marketing",
    features: "Auto highlights|Caption styles|Multi-platform export",
    pricing_model: "paid",
    starting_price: "49",
    screenshot_urls: "https://logoipsum.com/artwork/373.png",
    promo_video_url: "https://youtu.be/dQw4w9WgXcQ",
    video_urls: "",
    social_x: "",
    social_linkedin: "https://linkedin.com/company/clipnova",
    social_youtube: "https://youtube.com/@clipnova",
    social_discord: ""
  },
  {
    user_id: "",
    founder_id: "",
    name: "PromptGuard",
    slug: "promptguard",
    tagline: "Govern prompts in production",
    description:
      "PromptGuard gives engineering and compliance teams policy checks, redaction, audit logs, and rollout controls for LLM prompts.",
    website_url: "https://promptguard.example.com",
    affiliate_url: "",
    logo_url: "https://logoipsum.com/artwork/430.png",
    categories: "Security, Developer tools",
    features: "Policy engine|Audit trail|PII redaction",
    pricing_model: "enterprise",
    starting_price: "199",
    screenshot_urls: "",
    promo_video_url: "",
    video_urls: "",
    social_x: "https://x.com/promptguard",
    social_linkedin: "",
    social_youtube: "",
    social_discord: "https://discord.gg/promptguard"
  },
  {
    user_id: "",
    founder_id: "",
    name: "RankLens",
    slug: "ranklens",
    tagline: "SEO intelligence for AI tools",
    description:
      "RankLens tracks category rankings, competitor moves, and content gaps so founders can grow directory visibility with data.",
    website_url: "https://ranklens.example.com",
    affiliate_url: "https://ranklens.example.com/partners",
    logo_url: "https://logoipsum.com/artwork/431.png",
    categories: "SEO, Analytics",
    features: "Rank tracking|Competitor alerts|Keyword gaps",
    pricing_model: "freemium",
    starting_price: "0",
    screenshot_urls: "https://logoipsum.com/artwork/374.png|https://logoipsum.com/artwork/375.png",
    promo_video_url: "",
    video_urls: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    social_x: "",
    social_linkedin: "https://linkedin.com/company/ranklens",
    social_youtube: "",
    social_discord: ""
  },
  {
    user_id: "",
    founder_id: "",
    name: "VoiceMint",
    slug: "voicemint",
    tagline: "Studio-grade AI voiceovers",
    description:
      "VoiceMint produces natural narration for courses, ads, and product demos with brand voice presets and multilingual output.",
    website_url: "https://voicemint.example.com",
    affiliate_url: "",
    logo_url: "https://logoipsum.com/artwork/432.png",
    categories: "Audio, Creative",
    features: "Brand voices|Multilingual|Timeline editor",
    pricing_model: "usage-based",
    starting_price: "15",
    screenshot_urls: "",
    promo_video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    video_urls: "",
    social_x: "https://x.com/voicemint",
    social_linkedin: "",
    social_youtube: "https://youtube.com/@voicemint",
    social_discord: ""
  },
  {
    user_id: "",
    founder_id: "",
    name: "DataSage",
    slug: "datasage",
    tagline: "Ask your warehouse in plain English",
    description:
      "DataSage connects to warehouses and BI models so operators can query metrics, build charts, and share answers safely.",
    website_url: "https://datasage.example.com",
    affiliate_url: "",
    logo_url: "https://logoipsum.com/artwork/433.png",
    categories: "Analytics, Data",
    features: "Natural language SQL|Chart builder|Row-level security",
    pricing_model: "paid",
    starting_price: "99",
    screenshot_urls: "https://logoipsum.com/artwork/376.png",
    promo_video_url: "",
    video_urls: "",
    social_x: "",
    social_linkedin: "https://linkedin.com/company/datasage",
    social_youtube: "",
    social_discord: ""
  },
  {
    user_id: "",
    founder_id: "",
    name: "LaunchPad AI",
    slug: "launchpad-ai",
    tagline: "Coordinate product launches",
    description:
      "LaunchPad AI centralizes launch checklists, asset approvals, changelog posts, and directory submissions for SaaS teams.",
    website_url: "https://launchpad-ai.example.com",
    affiliate_url: "",
    logo_url: "https://logoipsum.com/artwork/434.png",
    categories: "Productivity, Marketing",
    features: "Launch templates|Asset hub|Directory sync",
    pricing_model: "freemium",
    starting_price: "19",
    screenshot_urls: "",
    promo_video_url: "https://youtu.be/dQw4w9WgXcQ",
    video_urls: "",
    social_x: "https://x.com/launchpadai",
    social_linkedin: "",
    social_youtube: "",
    social_discord: ""
  },
  {
    user_id: "",
    founder_id: "",
    name: "ContractIQ",
    slug: "contractiq",
    tagline: "Review contracts with AI",
    description:
      "ContractIQ highlights risky clauses, suggests redlines, and exports lawyer-ready summaries for procurement and legal ops.",
    website_url: "https://contractiq.example.com",
    affiliate_url: "",
    logo_url: "https://logoipsum.com/artwork/435.png",
    categories: "Legal, Enterprise",
    features: "Risk scoring|Redline suggestions|Export to Word",
    pricing_model: "enterprise",
    starting_price: "249",
    screenshot_urls: "https://logoipsum.com/artwork/377.png",
    promo_video_url: "",
    video_urls: "",
    social_x: "",
    social_linkedin: "https://linkedin.com/company/contractiq",
    social_youtube: "",
    social_discord: ""
  },
  {
    user_id: "",
    founder_id: "",
    name: "SupportOrbit",
    slug: "supportorbit",
    tagline: "AI helpdesk for SaaS",
    description:
      "SupportOrbit deflects tickets with grounded answers, routes escalations, and measures resolution quality across channels.",
    website_url: "https://supportorbit.example.com",
    affiliate_url: "https://supportorbit.example.com/?utm=partner",
    logo_url: "https://logoipsum.com/artwork/436.png",
    categories: "Support, SaaS",
    features: "Ticket deflection|Human handoff|Quality scoring",
    pricing_model: "paid",
    starting_price: "79",
    screenshot_urls: "",
    promo_video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    video_urls: "",
    social_x: "",
    social_linkedin: "",
    social_youtube: "",
    social_discord: "https://discord.gg/supportorbit"
  },
  {
    user_id: "",
    founder_id: "",
    name: "ModelBench",
    slug: "modelbench",
    tagline: "Benchmark LLMs for your use case",
    description:
      "ModelBench runs repeatable evals on accuracy, latency, and cost so teams can pick the right model before production rollout.",
    website_url: "https://modelbench.example.com",
    affiliate_url: "",
    logo_url: "https://logoipsum.com/artwork/437.png",
    categories: "Developer tools, AI infrastructure",
    features: "Eval suites|Latency tests|Cost projections",
    pricing_model: "free",
    starting_price: "0",
    screenshot_urls: "https://logoipsum.com/artwork/378.png|https://logoipsum.com/artwork/379.png",
    promo_video_url: "",
    video_urls: "",
    social_x: "https://x.com/modelbench",
    social_linkedin: "https://linkedin.com/company/modelbench",
    social_youtube: "https://youtube.com/@modelbench",
    social_discord: ""
  }
];
