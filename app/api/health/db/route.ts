import { NextResponse } from "next/server";
import { getProjectEnvRoot, requireDatabaseUrl } from "@/lib/db/load-env";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const databaseUrl = requireDatabaseUrl();
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: true,
      cwd: process.cwd(),
      envRoot: getProjectEnvRoot(),
      databaseConfigured: Boolean(databaseUrl)
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    return NextResponse.json(
      {
        ok: false,
        cwd: process.cwd(),
        envRoot: getProjectEnvRoot(),
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL?.trim()),
        error: error instanceof Error ? error.message : "Database unavailable"
      },
      { status: 503 }
    );
  }
}
