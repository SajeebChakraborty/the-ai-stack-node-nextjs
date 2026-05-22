import { NextResponse } from "next/server";
import { processAutomationAutoReleases } from "@/lib/automation/escrow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Auto-release escrowed automation funds whose hold window has elapsed.
 *
 * Wire this to your cron of choice (Vercel cron, GitHub Actions, etc.). To
 * protect it, set `AUTOMATION_CRON_SECRET` in your env and call with
 * `Authorization: Bearer <secret>`.
 */
async function runAutoRelease(request: Request) {
  const secret = process.env.AUTOMATION_CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const releasedIds = await processAutomationAutoReleases();
  return NextResponse.json({ ok: true, releasedCount: releasedIds.length, releasedIds });
}

export async function GET(request: Request) {
  return runAutoRelease(request);
}

export async function POST(request: Request) {
  return runAutoRelease(request);
}
