import { NextResponse } from "next/server";
import { enqueueBulkClaimJob, mapBulkClaimJob } from "@/lib/admin/bulk-claim-queue";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { prisma } from "@/lib/db/prisma";

type Context = {
  params: Promise<{ jobId: string }>;
};

export async function GET(_request: Request, context: Context) {
  const auth = await requireAdminApi();
  if (auth.error) {
    return auth.error;
  }

  const { jobId } = await context.params;

  const job = await prisma.bulkClaimImportJob.findFirst({
    where: {
      id: jobId,
      adminId: auth.user.id
    }
  });

  if (!job) {
    return NextResponse.json({ error: "Import job not found." }, { status: 404 });
  }

  if (job.status === "queued") {
    enqueueBulkClaimJob(job.id);
  }

  return NextResponse.json({ job: mapBulkClaimJob(job) });
}
