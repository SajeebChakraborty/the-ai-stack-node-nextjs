import { NextResponse } from "next/server";
import { getDirectoryFilterOptions, getDirectoryTools } from "@/lib/queries/directory";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? searchParams.get("query") ?? "";
  const category = searchParams.get("category") ?? "all";
  const pricing = searchParams.get("pricing") ?? "all";
  const sort = (searchParams.get("sort") ?? "trending") as "trending" | "top-rated" | "fastest-growing" | "newest";
  const verified = searchParams.get("verified") === "true";

  try {
    const [tools, filters] = await Promise.all([
      getDirectoryTools({ query, category, pricing, verified, sort }),
      getDirectoryFilterOptions()
    ]);

    return NextResponse.json({ tools, filters, total: tools.length });
  } catch {
    return NextResponse.json({ error: "Could not load directory listings." }, { status: 503 });
  }
}
