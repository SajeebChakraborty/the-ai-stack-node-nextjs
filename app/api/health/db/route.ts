import { NextResponse } from "next/server";
import { databaseErrorMessage } from "@/lib/db/database-error";
import { getProjectEnvRoot, requireDatabaseUrl } from "@/lib/db/load-env";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const databaseUrl = requireDatabaseUrl();

    // SELECT 1 succeeds even when app tables are missing; login needs `Profile`.
    await prisma.$queryRaw`SELECT 1`;
    await prisma.profile.findFirst({
      select: { id: true }
    });

    return NextResponse.json({
      ok: true,
      cwd: process.cwd(),
      envRoot: getProjectEnvRoot(),
      databaseConfigured: Boolean(databaseUrl),
      profileTableOk: true
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    return NextResponse.json(
      {
        ok: false,
        cwd: process.cwd(),
        envRoot: getProjectEnvRoot(),
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL?.trim()),
        hint: databaseErrorMessage(error),
        error: error instanceof Error ? error.message : "Database unavailable"
      },
      { status: 503 }
    );
  }
}
