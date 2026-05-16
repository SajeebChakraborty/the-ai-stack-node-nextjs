import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { countBulkClaimDataRows } from "@/lib/admin/bulk-claim";
import { enqueueBulkClaimJob, mapBulkClaimJob, resumeStalledBulkClaimJobs } from "@/lib/admin/bulk-claim-queue";
import { parseBulkClaimWorkbook } from "@/lib/admin/bulk-claim-workbook";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) {
    return auth.error;
  }

  await resumeStalledBulkClaimJobs();

  const activeJob = await prisma.bulkClaimImportJob.findFirst({
    where: {
      adminId: auth.user.id,
      status: {
        in: ["queued", "processing"]
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const latestJob =
    activeJob ??
    (await prisma.bulkClaimImportJob.findFirst({
      where: { adminId: auth.user.id },
      orderBy: { createdAt: "desc" }
    }));

  if (!latestJob) {
    return NextResponse.json({ job: null });
  }

  if (latestJob.status === "queued") {
    enqueueBulkClaimJob(latestJob.id);
  }

  return NextResponse.json({ job: mapBulkClaimJob(latestJob) });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth.error) {
    return auth.error;
  }

  const activeJob = await prisma.bulkClaimImportJob.findFirst({
    where: {
      adminId: auth.user.id,
      status: {
        in: ["queued", "processing"]
      }
    },
    select: { id: true }
  });

  if (activeJob) {
    return NextResponse.json(
      { error: "A bulk import is already running. Wait for it to finish or refresh progress." },
      { status: 409 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload an Excel file (.xlsx)." }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".xlsx") && !file.name.toLowerCase().endsWith(".xls")) {
    return NextResponse.json({ error: "Only .xlsx or .xls spreadsheets are supported." }, { status: 400 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const rows = parseBulkClaimWorkbook(buffer);
    const totalRows = countBulkClaimDataRows(rows);

    if (!totalRows) {
      return NextResponse.json({ error: "The spreadsheet has no claim rows." }, { status: 400 });
    }

    const job = await prisma.bulkClaimImportJob.create({
      data: {
        adminId: auth.user.id,
        fileName: file.name,
        totalRows,
        rows: rows as Prisma.InputJsonValue
      }
    });

    enqueueBulkClaimJob(job.id);

    return NextResponse.json({
      message: "Bulk import queued. Processing in the background.",
      job: mapBulkClaimJob(job)
    });
  } catch {
    return NextResponse.json({ error: "Could not process the spreadsheet. Check the format and try again." }, { status: 500 });
  }
}
