import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { deleteOwnedCourse, getOwnedCourseById, updateAdminCourse } from "@/lib/queries/courses";
import { userCourseSchema } from "@/lib/validation/schemas";

type Context = {
  params: Promise<{ courseId: string }>;
};

export async function GET(_request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { courseId } = await context.params;
  const course = await getOwnedCourseById(user.id, courseId);
  if (!course) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  return NextResponse.json({ course });
}

export async function PATCH(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to update a course." }, { status: 401 });
  }

  const { courseId } = await context.params;
  const existing = await getOwnedCourseById(user.id, courseId);
  if (!existing) {
    return NextResponse.json({ error: "Course not found or not yours." }, { status: 404 });
  }

  const parsed = userCourseSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid course payload." },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const priceCents = Math.round(data.priceUsd * 100);

  try {
    const course = await updateAdminCourse(courseId, {
      title: data.title,
      shortDescription: data.shortDescription,
      description: data.description,
      promoVideoUrl: data.promoVideoUrl || undefined,
      thumbnailUrl: data.thumbnailUrl || undefined,
      requirements: data.requirements,
      targetAudience: data.targetAudience,
      learningObjectives: data.learningObjectives,
      includes: data.includes ?? [],
      level: data.level,
      status: "published",
      featured: existing.featured,
      instructorName: existing.instructorName,
      categorySlugs: data.categorySlugs ?? [],
      sections: data.sections?.map((section) => ({
        title: section.title,
        lessons: section.lessons?.map((lesson) => ({
          title: lesson.title,
          videoUrl: lesson.videoUrl || undefined,
          durationSeconds: lesson.durationSeconds ?? 0,
          isPreview: lesson.isPreview ?? false
        }))
      })),
      ownerId: user.id,
      priceCents,
      currency: existing.currency
    });

    return NextResponse.json({ course });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update course.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to delete a course." }, { status: 401 });
  }

  const { courseId } = await context.params;
  const result = await deleteOwnedCourse(user.id, courseId);

  if (!result.ok) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  return NextResponse.json({
    deleted: !result.archived,
    archived: result.archived
  });
}
