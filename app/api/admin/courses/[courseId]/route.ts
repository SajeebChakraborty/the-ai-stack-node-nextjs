import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { deleteAdminCourse, getAdminCourseById, updateAdminCourse } from "@/lib/queries/courses";

const courseSchema = z.object({
  slug: z.string().optional(),
  title: z.string().min(3),
  shortDescription: z.string().min(10),
  description: z.string().min(20),
  promoVideoUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  targetAudience: z.array(z.string()).optional(),
  learningObjectives: z.array(z.string()).optional(),
  includes: z.array(z.string()).optional(),
  defaultRating: z.number().min(1).max(5).optional(),
  defaultReviewCount: z.number().int().min(0).optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  featured: z.boolean().optional(),
  instructorName: z.string().min(2),
  instructorTitle: z.string().optional(),
  instructorAvatarUrl: z.string().optional(),
  instructorBio: z.string().optional(),
  releasedAt: z.string().nullable().optional(),
  categorySlugs: z.array(z.string()).optional(),
  sections: z.array(z.any()).optional(),
  faqs: z.array(z.any()).optional()
});

type Props = { params: Promise<{ courseId: string }> };

export async function GET(_request: Request, { params }: Props) {
  const auth = await requireAdminApi();
  if (auth.error) {
    return auth.error;
  }

  const { courseId } = await params;
  const course = await getAdminCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  return NextResponse.json({ course });
}

export async function PUT(request: Request, { params }: Props) {
  const auth = await requireAdminApi();
  if (auth.error) {
    return auth.error;
  }

  const { courseId } = await params;
  const payload = courseSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: payload.error.issues[0]?.message ?? "Invalid course." }, { status: 400 });
  }

  const course = await updateAdminCourse(courseId, payload.data);
  return NextResponse.json({ course });
}

export async function DELETE(_request: Request, { params }: Props) {
  const auth = await requireAdminApi();
  if (auth.error) {
    return auth.error;
  }

  const { courseId } = await params;
  await deleteAdminCourse(courseId);
  return NextResponse.json({ message: "Course deleted." });
}
