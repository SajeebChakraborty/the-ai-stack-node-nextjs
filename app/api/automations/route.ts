import { NextResponse } from "next/server";
import { getAutomationsPage } from "@/lib/queries/automations";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(48, Math.max(1, Number(url.searchParams.get("pageSize") ?? "12")));
  const query = url.searchParams.get("q") ?? undefined;

  try {
    const result = await getAutomationsPage({ query, page, pageSize });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ automations: [], total: 0, page, pageSize, hasMore: false }, { status: 200 });
  }
}
