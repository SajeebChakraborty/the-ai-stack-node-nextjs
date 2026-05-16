import "server-only";

import { ensureFounderProfileRecord } from "@/lib/auth/member-access";
import { prisma } from "@/lib/db/prisma";
import type { ListingClaimRequestStatus } from "@/types/domain";
import type { ListingClaimRequestView } from "@/types/listing-claim-request";

export type { ListingClaimRequestView };

function parseAttachmentUrls(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function mapListingClaimRequest(row: {
  id: string;
  status: string;
  businessName: string;
  businessStartDate: Date;
  businessRegistrationDate: Date;
  businessDocumentUrl: string;
  additionalNotes: string | null;
  attachmentUrls: unknown;
  adminNotes: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  tool: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    logoUrl: string | null;
    founderId: string | null;
  };
  requester: {
    id: string;
    fullName: string | null;
    email: string;
  };
}): ListingClaimRequestView {
  return {
    id: row.id,
    status: row.status as ListingClaimRequestStatus,
    businessName: row.businessName,
    businessStartDate: row.businessStartDate.toISOString(),
    businessRegistrationDate: row.businessRegistrationDate.toISOString(),
    businessDocumentUrl: row.businessDocumentUrl,
    additionalNotes: row.additionalNotes,
    attachmentUrls: parseAttachmentUrls(row.attachmentUrls),
    adminNotes: row.adminNotes,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    tool: row.tool,
    requester: {
      id: row.requester.id,
      name: row.requester.fullName ?? row.requester.email.split("@")[0] ?? "User",
      email: row.requester.email
    }
  };
}

const requestInclude = {
  tool: {
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      logoUrl: true,
      founderId: true
    }
  },
  requester: {
    select: {
      id: true,
      fullName: true,
      email: true
    }
  }
} as const;

export async function getUserListingClaimRequests(userId: string) {
  const rows = await prisma.listingClaimRequest.findMany({
    where: { requesterId: userId },
    include: requestInclude,
    orderBy: { createdAt: "desc" }
  });

  return rows.map(mapListingClaimRequest);
}

export async function getAdminListingClaimRequests(status?: ListingClaimRequestStatus) {
  const rows = await prisma.listingClaimRequest.findMany({
    where: status ? { status } : undefined,
    include: requestInclude,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }]
  });

  return rows.map(mapListingClaimRequest);
}

export async function getPendingListingClaimRequestCount() {
  return prisma.listingClaimRequest.count({
    where: { status: "pending" }
  });
}

export async function approveListingClaimRequest(requestId: string, adminId: string, adminNotes?: string) {
  const request = await prisma.listingClaimRequest.findUnique({
    where: { id: requestId },
    include: {
      tool: { select: { id: true, founderId: true, name: true } }
    }
  });

  if (!request) {
    throw new Error("REQUEST_NOT_FOUND");
  }

  if (request.status !== "pending") {
    throw new Error("REQUEST_ALREADY_REVIEWED");
  }

  if (request.tool.founderId) {
    throw new Error("LISTING_ALREADY_CLAIMED");
  }

  await ensureFounderProfileRecord(request.requesterId);

  await prisma.$transaction([
    prisma.tool.update({
      where: { id: request.toolId },
      data: {
        founderId: request.requesterId,
        verified: true,
        status: "published"
      }
    }),
    prisma.listingClaimRequest.update({
      where: { id: requestId },
      data: {
        status: "approved",
        adminNotes: adminNotes?.trim() || null,
        reviewedAt: new Date(),
        reviewedById: adminId
      }
    })
  ]);

  return request.tool.name;
}

export async function rejectListingClaimRequest(requestId: string, adminId: string, adminNotes?: string) {
  const request = await prisma.listingClaimRequest.findUnique({
    where: { id: requestId },
    select: { id: true, status: true }
  });

  if (!request) {
    throw new Error("REQUEST_NOT_FOUND");
  }

  if (request.status !== "pending") {
    throw new Error("REQUEST_ALREADY_REVIEWED");
  }

  await prisma.listingClaimRequest.update({
    where: { id: requestId },
    data: {
      status: "rejected",
      adminNotes: adminNotes?.trim() || null,
      reviewedAt: new Date(),
      reviewedById: adminId
    }
  });
}
