import "server-only";

import type { BulkClaimImportResult } from "@/lib/admin/bulk-claim";
import { importBulkClaimRow } from "@/lib/admin/bulk-claim";
import { prisma } from "@/lib/db/prisma";

const runningJobIds = new Set<string>();

type JobRowPayload = Record<string, unknown>;

function parseJobRows(rows: unknown): JobRowPayload[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows as JobRowPayload[];
}

function parseCreatedResults(value: unknown): BulkClaimImportResult["created"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value as BulkClaimImportResult["created"];
}

function parseFailedResults(value: unknown): BulkClaimImportResult["failed"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value as BulkClaimImportResult["failed"];
}

export function enqueueBulkClaimJob(jobId: string) {
  if (runningJobIds.has(jobId)) {
    return;
  }

  runningJobIds.add(jobId);

  void processBulkClaimJob(jobId).finally(() => {
    runningJobIds.delete(jobId);
  });
}

export async function processBulkClaimJob(jobId: string) {
  const job = await prisma.bulkClaimImportJob.findUnique({
    where: { id: jobId }
  });

  if (!job || job.status === "completed" || job.status === "failed") {
    return;
  }

  const rows = parseJobRows(job.rows);
  let created = parseCreatedResults(job.created);
  let failed = parseFailedResults(job.failed);
  let nextRowIndex = job.nextRowIndex;
  let processedRows = job.processedRows;
  let createdCount = job.createdCount;
  let failedCount = job.failedCount;

  await prisma.bulkClaimImportJob.update({
    where: { id: jobId },
    data: {
      status: "processing",
      startedAt: job.startedAt ?? new Date()
    }
  });

  try {
    for (let index = nextRowIndex; index < rows.length; index += 1) {
      const rowNumber = index + 2;
      const outcome = await importBulkClaimRow(rows[index] ?? {}, rowNumber);

      if ("skipped" in outcome && outcome.skipped) {
        nextRowIndex = index + 1;
        continue;
      }

      processedRows += 1;
      nextRowIndex = index + 1;

      if (outcome.ok) {
        created = [...created, outcome.created];
        createdCount += 1;
      } else if ("failed" in outcome) {
        failed = [...failed, outcome.failed];
        failedCount += 1;
      }

      await prisma.bulkClaimImportJob.update({
        where: { id: jobId },
        data: {
          nextRowIndex,
          processedRows,
          createdCount,
          failedCount,
          created,
          failed
        }
      });
    }

    await prisma.bulkClaimImportJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        completedAt: new Date(),
        nextRowIndex,
        processedRows,
        createdCount,
        failedCount,
        created,
        failed
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bulk import failed unexpectedly.";

    await prisma.bulkClaimImportJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        errorMessage: message,
        completedAt: new Date(),
        nextRowIndex,
        processedRows,
        createdCount,
        failedCount,
        created,
        failed
      }
    });
  }
}

export async function resumeStalledBulkClaimJobs() {
  const stalled = await prisma.bulkClaimImportJob.findMany({
    where: {
      status: {
        in: ["queued", "processing"]
      }
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
    take: 3
  });

  for (const job of stalled) {
    enqueueBulkClaimJob(job.id);
  }
}

export function mapBulkClaimJob(job: {
  id: string;
  status: string;
  fileName: string | null;
  totalRows: number;
  processedRows: number;
  createdCount: number;
  failedCount: number;
  created: unknown;
  failed: unknown;
  errorMessage: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}) {
  const progressPercent =
    job.totalRows > 0 ? Math.min(100, Math.round((job.processedRows / job.totalRows) * 100)) : 0;

  return {
    id: job.id,
    status: job.status,
    fileName: job.fileName,
    totalRows: job.totalRows,
    processedRows: job.processedRows,
    createdCount: job.createdCount,
    failedCount: job.failedCount,
    progressPercent,
    created: parseCreatedResults(job.created),
    failed: parseFailedResults(job.failed),
    errorMessage: job.errorMessage,
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString()
  };
}
