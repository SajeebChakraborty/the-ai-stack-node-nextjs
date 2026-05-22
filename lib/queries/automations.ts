import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { slugifyCourse } from "@/lib/courses/utils";

type CreateAutomationInput = {
  ownerId: string;
  title: string;
  shortDescription: string;
  description: string;
  thumbnailUrl?: string;
  promoVideoUrl?: string;
  zipFileUrl: string;
  setupInstructions?: string;
  toolingTags?: string[];
  highlights?: string[];
  setupMinutes?: number;
  priceCents: number;
  currency?: string;
};

function parseStringArray(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    .map((entry) => entry.trim());
}

export type AutomationListItem = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  thumbnailUrl: string | null;
  promoVideoUrl: string | null;
  priceCents: number;
  currency: string;
  ownerId: string;
  ownerName: string;
  featured: boolean;
  setupMinutes: number;
  toolingTags: string[];
  createdAt: string;
};

export type AutomationDetail = AutomationListItem & {
  description: string;
  setupInstructions: string | null;
  highlights: string[];
  /** Only populated for the buyer post-purchase; never returned publicly. */
  zipFileUrl?: string | null;
  hasPurchased: boolean;
};

function mapListItem(row: Prisma.AutomationGetPayload<{ include: { owner: { select: { fullName: true; email: true } } } }>): AutomationListItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.shortDescription,
    thumbnailUrl: row.thumbnailUrl,
    promoVideoUrl: row.promoVideoUrl,
    priceCents: row.priceCents,
    currency: (row.currency ?? "usd").toLowerCase(),
    ownerId: row.ownerId,
    ownerName: row.owner?.fullName ?? row.owner?.email?.split("@")[0] ?? "Creator",
    featured: row.featured,
    setupMinutes: row.setupMinutes,
    toolingTags: parseStringArray(row.toolingTags),
    createdAt: row.createdAt.toISOString()
  };
}

export async function getAutomationsPage(params?: {
  query?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, params?.pageSize ?? 12));
  const skip = (page - 1) * pageSize;
  const query = params?.query?.trim();

  const where: Prisma.AutomationWhereInput = {
    status: "published",
    ...(query
      ? {
          OR: [
            { title: { contains: query } },
            { shortDescription: { contains: query } },
            { description: { contains: query } }
          ]
        }
      : {})
  };

  try {
    const [total, rows] = await Promise.all([
      prisma.automation.count({ where }),
      prisma.automation.findMany({
        where,
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        include: { owner: { select: { fullName: true, email: true } } },
        skip,
        take: pageSize
      })
    ]);

    return {
      automations: rows.map(mapListItem),
      total,
      page,
      pageSize,
      hasMore: skip + rows.length < total
    };
  } catch {
    return {
      automations: [] as AutomationListItem[],
      total: 0,
      page,
      pageSize,
      hasMore: false
    };
  }
}

export async function getAutomationDetail(slug: string, userId?: string | null): Promise<AutomationDetail | null> {
  const row = await prisma.automation.findFirst({
    where: { slug, status: "published" },
    include: { owner: { select: { fullName: true, email: true } } }
  });

  if (!row) return null;

  let hasPurchased = false;
  let zipFileUrl: string | null = null;

  if (userId) {
    if (row.ownerId === userId) {
      hasPurchased = true;
      zipFileUrl = row.zipFileUrl;
    } else {
      const purchase = await prisma.automationPurchase.findFirst({
        where: {
          automationId: row.id,
          buyerId: userId,
          status: { in: ["paid_holding", "setup_confirmed", "released", "complained"] }
        },
        select: { id: true }
      });
      hasPurchased = Boolean(purchase);
      zipFileUrl = hasPurchased ? row.zipFileUrl : null;
    }
  }

  return {
    ...mapListItem(row),
    description: row.description,
    setupInstructions: row.setupInstructions,
    highlights: parseStringArray(row.highlights),
    zipFileUrl,
    hasPurchased
  };
}

export async function createAutomation(input: CreateAutomationInput) {
  const slug = await ensureUniqueSlug(slugifyCourse(input.title));

  return prisma.automation.create({
    data: {
      slug,
      title: input.title,
      shortDescription: input.shortDescription,
      description: input.description,
      thumbnailUrl: input.thumbnailUrl || null,
      promoVideoUrl: input.promoVideoUrl || null,
      zipFileUrl: input.zipFileUrl,
      setupInstructions: input.setupInstructions || null,
      toolingTags: input.toolingTags ?? [],
      highlights: input.highlights ?? [],
      setupMinutes: Math.max(0, Math.round(input.setupMinutes ?? 30)),
      priceCents: Math.max(0, Math.round(input.priceCents)),
      currency: (input.currency ?? "usd").toLowerCase(),
      status: "published",
      ownerId: input.ownerId
    }
  });
}

export async function updateOwnedAutomation(
  ownerId: string,
  automationId: string,
  input: Omit<CreateAutomationInput, "ownerId">
) {
  const existing = await prisma.automation.findFirst({
    where: { id: automationId, ownerId },
    select: { id: true }
  });
  if (!existing) return null;

  return prisma.automation.update({
    where: { id: automationId },
    data: {
      title: input.title,
      shortDescription: input.shortDescription,
      description: input.description,
      thumbnailUrl: input.thumbnailUrl || null,
      promoVideoUrl: input.promoVideoUrl || null,
      zipFileUrl: input.zipFileUrl,
      setupInstructions: input.setupInstructions || null,
      toolingTags: input.toolingTags ?? [],
      highlights: input.highlights ?? [],
      setupMinutes: Math.max(0, Math.round(input.setupMinutes ?? 30)),
      priceCents: Math.max(0, Math.round(input.priceCents)),
      currency: (input.currency ?? "usd").toLowerCase()
    }
  });
}

export async function listAutomationsByOwner(ownerId: string) {
  const rows = await prisma.automation.findMany({
    where: { ownerId },
    orderBy: [{ updatedAt: "desc" }],
    include: { _count: { select: { purchases: true } } }
  });

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.shortDescription,
    status: row.status,
    priceCents: row.priceCents,
    currency: row.currency,
    thumbnailUrl: row.thumbnailUrl,
    purchaseCount: row._count.purchases,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }));
}

export async function deleteOwnedAutomation(ownerId: string, automationId: string) {
  const row = await prisma.automation.findFirst({
    where: { id: automationId, ownerId },
    select: { id: true, _count: { select: { purchases: true } } }
  });

  if (!row) return { ok: false as const, reason: "not_found" as const };

  if (row._count.purchases > 0) {
    await prisma.automation.update({
      where: { id: automationId },
      data: { status: "archived" }
    });
    return { ok: true as const, archived: true };
  }

  await prisma.automation.delete({ where: { id: automationId } });
  return { ok: true as const, archived: false };
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let candidate = base || `automation-${Date.now()}`;
  let attempt = 0;
  while (true) {
    const existing = await prisma.automation.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    attempt += 1;
    candidate = `${base}-${attempt + 1}`;
    if (attempt > 25) {
      return `${base}-${Date.now()}`;
    }
  }
}
