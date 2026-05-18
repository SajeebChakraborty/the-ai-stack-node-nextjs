import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { getCourseDetailBySlug, markLessonComplete } from "@/lib/queries/courses";

const schema = z.object({
  lessonId: z.string().min(1)
});

type Props = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: Props) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { slug } = await params;
  const payload = schema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Lesson id is required." }, { status: 400 });
  }

  const progress = await markLessonComplete(user.id, slug, payload.data.lessonId);
  if (!progress) {
    return NextResponse.json({ error: "Enrollment or lesson not found." }, { status: 404 });
  }

  const detail = await getCourseDetailBySlug(slug, user.id);
  return NextResponse.json({ progress, course: detail?.course });
}
