import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ensureCourseCatalogSeeded, getCourseDetailBySlug } from "@/lib/queries/courses";

type Props = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Props) {
  const { slug } = await params;

  try {
    await ensureCourseCatalogSeeded();
    const user = await getCurrentUser();
    const result = await getCourseDetailBySlug(slug, user?.id);

    if (!result) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Could not load course." }, { status: 503 });
  }
}
