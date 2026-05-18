import { NextResponse } from "next/server";
import { z } from "zod";
import { assertUserCanEnrollCourse } from "@/lib/courses/entitlements";
import { getCurrentUser } from "@/lib/auth/session";
import { enrollUserInCourse, getCourseDetailBySlug } from "@/lib/queries/courses";
import { prisma } from "@/lib/db/prisma";

const schema = z.object({
  courseId: z.string().optional(),
  slug: z.string().optional()
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to enroll in a course." }, { status: 401 });
  }

  const payload = schema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid enrollment request." }, { status: 400 });
  }

  const course = await prisma.course.findFirst({
    where: {
      status: "published",
      ...(payload.data.courseId ? { id: payload.data.courseId } : { slug: payload.data.slug })
    },
    select: { id: true, slug: true }
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  const gate = await assertUserCanEnrollCourse(user.id, course.id);
  if (!gate.ok) {
    return NextResponse.json(
      {
        error: "Course enrollment limit reached for your plan.",
        code: gate.code,
        entitlements: gate.entitlements
      },
      { status: 403 }
    );
  }

  if (!gate.alreadyEnrolled) {
    await enrollUserInCourse(user.id, course.id);
  }

  const detail = await getCourseDetailBySlug(course.slug, user.id);
  return NextResponse.json({
    message: gate.alreadyEnrolled ? "You are already enrolled." : "Enrollment successful.",
    course: detail?.course
  });
}
