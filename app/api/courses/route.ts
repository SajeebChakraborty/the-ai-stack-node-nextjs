import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ensureCourseCatalogSeeded, getCoursesPage, listCourseCategories } from "@/lib/queries/courses";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filtersOnly = searchParams.get("filtersOnly") === "true";

  try {
    await ensureCourseCatalogSeeded();

    if (filtersOnly) {
      const categories = await listCourseCategories();
      return NextResponse.json({
        categories: categories.map((category) => ({ slug: category.slug, name: category.name }))
      });
    }

    const page = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const pageSize = Number.parseInt(searchParams.get("pageSize") ?? "12", 10);
    const listing = await getCoursesPage({
      query: searchParams.get("q") ?? "",
      category: searchParams.get("category") ?? "all",
      level: searchParams.get("level") ?? "all",
      page,
      pageSize
    });

    const user = await getCurrentUser();
    let enrolledCourseIds: string[] = [];
    if (user) {
      const { prisma } = await import("@/lib/db/prisma");
      const rows = await prisma.courseEnrollment.findMany({
        where: { userId: user.id },
        select: { courseId: true }
      });
      enrolledCourseIds = rows.map((row) => row.courseId);
    }

    return NextResponse.json({ ...listing, enrolledCourseIds });
  } catch {
    return NextResponse.json({ error: "Could not load courses." }, { status: 503 });
  }
}
