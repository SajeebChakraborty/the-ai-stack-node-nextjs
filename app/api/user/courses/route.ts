import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminCourse, listCoursesByOwner } from "@/lib/queries/courses";
import { userCourseSchema } from "@/lib/validation/schemas";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const courses = await listCoursesByOwner(user.id);
    return NextResponse.json({ courses });
  } catch {
    return NextResponse.json({ error: "Could not load your courses." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to create a course." }, { status: 401 });
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
    const course = await createAdminCourse({
      title: data.title,
      shortDescription: data.shortDescription,
      description: data.description,
      promoVideoUrl: data.promoVideoUrl || undefined,
      thumbnailUrl: data.thumbnailUrl || undefined,
      requirements: data.requirements,
      targetAudience: data.targetAudience,
      learningObjectives: data.learningObjectives,
      includes: data.includes ?? ["Self-paced lessons", "Certificate on completion"],
      level: data.level,
      // Auto-publish per marketplace decision.
      status: "published",
      featured: false,
      instructorName: user.name ?? user.email.split("@")[0] ?? "Creator",
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
      currency: "usd"
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create course.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
