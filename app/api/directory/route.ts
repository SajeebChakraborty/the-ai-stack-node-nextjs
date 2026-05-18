import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getDirectoryFilterOptions, getDirectoryToolsPage, getPendingClaimToolIds } from "@/lib/queries/directory";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filtersOnly = searchParams.get("filtersOnly") === "true";

  if (filtersOnly) {
    try {
      const filters = await getDirectoryFilterOptions();
      return NextResponse.json({ filters });
    } catch {
      return NextResponse.json({ error: "Could not load directory filters." }, { status: 503 });
    }
  }

  const query = searchParams.get("q") ?? searchParams.get("query") ?? "";
  const category = searchParams.get("category") ?? "all";
  const pricing = searchParams.get("pricing") ?? "all";
  const sort = (searchParams.get("sort") ?? "trending") as "trending" | "top-rated" | "fastest-growing" | "newest";
  const verified = searchParams.get("verified") === "true";
  const page = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = Number.parseInt(searchParams.get("pageSize") ?? searchParams.get("limit") ?? "12", 10);
  const includeFilters = searchParams.get("includeFilters") === "true";

  try {
    const user = await getCurrentUser();
    const [listing, pendingClaimToolIds, filters] = await Promise.all([
      getDirectoryToolsPage({ query, category, pricing, verified, sort, page, pageSize }),
      user ? getPendingClaimToolIds(user.id) : Promise.resolve([] as string[]),
      includeFilters ? getDirectoryFilterOptions() : Promise.resolve(null)
    ]);

    return NextResponse.json({
      tools: listing.tools,
      total: listing.total,
      page: listing.page,
      pageSize: listing.pageSize,
      hasMore: listing.hasMore,
      pendingClaimToolIds,
      ...(filters ? { filters } : {})
    });
  } catch {
    return NextResponse.json({ error: "Could not load directory listings." }, { status: 503 });
  }
}
