import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { formatDurationLabel, formatDurationMinutes, parseStringList, slugifyCourse, toMonthYearLabel } from "@/lib/courses/utils";
import type {
  CourseDetail,
  CourseEnrollmentSummary,
  CourseListItem,
  CourseLevel,
  CourseReviewView,
  CourseSectionView,
  CourseStatus
} from "@/types/course";

function toNumber(value: Prisma.Decimal | number | string | null | undefined) {
  if (value == null) {
    return 0;
  }
  return Number(value);
}

function computeCourseStats(sections: Array<{ lessons: Array<{ durationSeconds: number }> }>) {
  let lessonCount = 0;
  let durationSeconds = 0;

  for (const section of sections) {
    lessonCount += section.lessons.length;
    for (const lesson of section.lessons) {
      durationSeconds += lesson.durationSeconds;
    }
  }

  return {
    lessonCount,
    durationMinutes: Math.max(1, Math.round(durationSeconds / 60))
  };
}

function mapListItem(course: {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  thumbnailUrl: string | null;
  level: string;
  durationMinutes: number;
  lessonCount: number;
  defaultRating: Prisma.Decimal;
  defaultReviewCount: number;
  instructorName: string;
  featured: boolean;
  releasedAt: Date | null;
  categories: Array<{ category: { name: string } }>;
  reviews?: Array<{ rating: number }>;
}): CourseListItem {
  const userRatings = course.reviews?.map((review) => review.rating) ?? [];
  const rating =
    userRatings.length > 0
      ? Number((userRatings.reduce((sum, value) => sum + value, 0) / userRatings.length).toFixed(1))
      : toNumber(course.defaultRating);

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    shortDescription: course.shortDescription,
    thumbnailUrl: course.thumbnailUrl,
    level: course.level as CourseLevel,
    durationMinutes: course.durationMinutes,
    durationLabel: formatDurationMinutes(course.durationMinutes),
    lessonCount: course.lessonCount,
    rating,
    reviewCount: course.defaultReviewCount + (course.reviews?.length ?? 0),
    instructorName: course.instructorName,
    categories: course.categories.map((item) => item.category.name),
    featured: course.featured,
    releasedLabel: toMonthYearLabel(course.releasedAt)
  };
}

const listInclude = {
  categories: { include: { category: { select: { name: true } } } },
  reviews: { select: { rating: true }, where: { isFeatured: true }, take: 20 }
} satisfies Prisma.CourseInclude;

const detailInclude = {
  categories: { include: { category: { select: { name: true, slug: true } } } },
  sections: {
    orderBy: { sortOrder: "asc" },
    include: {
      lessons: {
        orderBy: { sortOrder: "asc" }
      }
    }
  },
  faqs: { orderBy: { sortOrder: "asc" } },
  reviews: {
    orderBy: { createdAt: "desc" },
    take: 12,
    include: {
      user: { select: { fullName: true } }
    }
  }
} satisfies Prisma.CourseInclude;

export async function listCourseCategories() {
  return prisma.courseCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
  });
}

export async function getCoursesPage(params?: {
  query?: string;
  category?: string;
  level?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.min(24, Math.max(1, params?.pageSize ?? 12));
  const skip = (page - 1) * pageSize;
  const query = params?.query?.trim();

  const where: Prisma.CourseWhereInput = {
    status: "published",
    ...(params?.level && params.level !== "all" ? { level: params.level as CourseLevel } : {}),
    ...(params?.category && params.category !== "all"
      ? {
          categories: {
            some: {
              category: {
                OR: [{ slug: params.category }, { name: { equals: params.category } }]
              }
            }
          }
        }
      : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query } },
            { shortDescription: { contains: query } },
            { description: { contains: query } },
            { instructorName: { contains: query } }
          ]
        }
      : {})
  };

  const [total, rows] = await Promise.all([
    prisma.course.count({ where }),
    prisma.course.findMany({
      where,
      include: listInclude,
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { releasedAt: "desc" }],
      skip,
      take: pageSize
    })
  ]);

  return {
    courses: rows.map(mapListItem),
    total,
    page,
    pageSize,
    hasMore: skip + rows.length < total
  };
}

export async function getCourseDetailBySlug(slug: string, userId?: string | null) {
  const course = await prisma.course.findFirst({
    where: { slug, status: "published" },
    include: detailInclude
  });

  if (!course) {
    return null;
  }

  let enrollment:
    | {
        id: string;
        completedAt: Date | null;
        lessonProgress: Array<{ lessonId: string }>;
      }
    | null = null;

  if (userId) {
    enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: course.id
        }
      },
      select: {
        id: true,
        completedAt: true,
        lessonProgress: { select: { lessonId: true } }
      }
    });
  }

  const completedLessonIds = new Set(enrollment?.lessonProgress.map((item) => item.lessonId) ?? []);
  const allLessons = course.sections.flatMap((section) => section.lessons);
  const completedLessons = allLessons.filter((lesson) => completedLessonIds.has(lesson.id)).length;
  const progressPercent = allLessons.length ? Math.round((completedLessons / allLessons.length) * 100) : 0;

  const listBase = mapListItem({ ...course, reviews: course.reviews.map((r) => ({ rating: r.rating })) });

  const sections: CourseSectionView[] = course.sections.map((section) => {
    const sectionSeconds = section.lessons.reduce((sum, lesson) => sum + lesson.durationSeconds, 0);
    return {
      id: section.id,
      title: section.title,
      sortOrder: section.sortOrder,
      durationLabel: formatDurationLabel(sectionSeconds),
      lessons: section.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        videoUrl: lesson.videoUrl,
        durationSeconds: lesson.durationSeconds,
        durationLabel: formatDurationLabel(lesson.durationSeconds),
        sortOrder: lesson.sortOrder,
        isPreview: lesson.isPreview,
        completed: completedLessonIds.has(lesson.id),
        locked: !enrollment && !lesson.isPreview
      }))
    };
  });

  const reviews: CourseReviewView[] = course.reviews.map((review) => ({
    id: review.id,
    authorName: review.authorName || review.user?.fullName || "Student",
    rating: review.rating,
    title: review.title,
    body: review.body,
    createdAt: review.createdAt.toISOString()
  }));

  const detail: CourseDetail = {
    ...listBase,
    description: course.description,
    promoVideoUrl: course.promoVideoUrl,
    requirements: parseStringList(course.requirements),
    targetAudience: parseStringList(course.targetAudience),
    learningObjectives: parseStringList(course.learningObjectives),
    includes: parseStringList(course.includes),
    instructorTitle: course.instructorTitle,
    instructorAvatarUrl: course.instructorAvatarUrl,
    instructorBio: course.instructorBio,
    sections,
    faqs: course.faqs.map((faq) => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer
    })),
    reviews,
    enrolled: Boolean(enrollment),
    completed: Boolean(enrollment?.completedAt),
    progressPercent,
    completedLessons
  };

  return { course: detail, enrollmentId: enrollment?.id ?? null };
}

export async function getUserCourseEnrollments(userId: string): Promise<CourseEnrollmentSummary[]> {
  const rows = await prisma.courseEnrollment.findMany({
    where: { userId },
    orderBy: { enrolledAt: "desc" },
    include: {
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          thumbnailUrl: true,
          instructorName: true,
          lessonCount: true
        }
      },
      lessonProgress: { select: { lessonId: true } }
    }
  });

  return rows.map((row) => {
    const completedLessons = row.lessonProgress.length;
    const lessonCount = row.course.lessonCount;
    const progressPercent = lessonCount ? Math.round((completedLessons / lessonCount) * 100) : 0;
    const completed = Boolean(row.completedAt) || progressPercent >= 100;

    return {
      enrollmentId: row.id,
      courseId: row.course.id,
      slug: row.course.slug,
      title: row.course.title,
      thumbnailUrl: row.course.thumbnailUrl,
      instructorName: row.course.instructorName,
      lessonCount,
      completedLessons,
      progressPercent,
      completed,
      certificateReady: completed,
      enrolledAt: row.enrolledAt.toISOString(),
      completedAt: row.completedAt?.toISOString() ?? null
    };
  });
}

export type AdminCourseInput = {
  slug?: string;
  title: string;
  shortDescription: string;
  description: string;
  promoVideoUrl?: string;
  thumbnailUrl?: string;
  requirements?: string[];
  targetAudience?: string[];
  learningObjectives?: string[];
  includes?: string[];
  defaultRating?: number;
  defaultReviewCount?: number;
  level?: CourseLevel;
  status?: CourseStatus;
  featured?: boolean;
  instructorName: string;
  instructorTitle?: string;
  instructorAvatarUrl?: string;
  instructorBio?: string;
  releasedAt?: string | null;
  categorySlugs?: string[];
  sections?: Array<{
    id?: string;
    title: string;
    sortOrder?: number;
    lessons?: Array<{
      id?: string;
      title: string;
      videoUrl?: string;
      durationSeconds?: number;
      sortOrder?: number;
      isPreview?: boolean;
    }>;
  }>;
  faqs?: Array<{ id?: string; question: string; answer: string; sortOrder?: number }>;
};

async function syncCourseCategories(courseId: string, categorySlugs: string[]) {
  await prisma.courseCategoryOnCourse.deleteMany({ where: { courseId } });

  if (!categorySlugs.length) {
    return;
  }

  const categories = await Promise.all(
    categorySlugs.map((slug) =>
      prisma.courseCategory.upsert({
        where: { slug },
        update: {},
        create: {
          slug,
          name: slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
        }
      })
    )
  );

  await prisma.courseCategoryOnCourse.createMany({
    data: categories.map((category) => ({ courseId, categoryId: category.id })),
    skipDuplicates: true
  });
}

async function syncCourseTree(courseId: string, sections: AdminCourseInput["sections"], faqs: AdminCourseInput["faqs"]) {
  const incomingSections = sections ?? [];
  const existingSections = await prisma.courseSection.findMany({
    where: { courseId },
    include: { lessons: true }
  });

  const keptSectionIds = new Set<string>();
  let lessonCount = 0;
  let durationSeconds = 0;

  for (const [sectionIndex, section] of incomingSections.entries()) {
    const title = section.title?.trim();
    if (!title) {
      continue;
    }

    const existingSection = section.id ? existingSections.find((row) => row.id === section.id) : null;
    const sectionRow = existingSection
      ? await prisma.courseSection.update({
          where: { id: existingSection.id },
          data: { title, sortOrder: section.sortOrder ?? sectionIndex }
        })
      : await prisma.courseSection.create({
          data: {
            courseId,
            title,
            sortOrder: section.sortOrder ?? sectionIndex
          }
        });

    keptSectionIds.add(sectionRow.id);

    const existingLessons = existingSection?.lessons ?? [];
    const keptLessonIds = new Set<string>();
    const incomingLessons = (section.lessons ?? []).filter((lesson) => lesson.title?.trim());

    for (const [lessonIndex, lesson] of incomingLessons.entries()) {
      lessonCount += 1;
      durationSeconds += lesson.durationSeconds ?? 0;

      const existingLesson = lesson.id ? existingLessons.find((row) => row.id === lesson.id) : null;
      const lessonRow = existingLesson
        ? await prisma.courseLesson.update({
            where: { id: existingLesson.id },
            data: {
              sectionId: sectionRow.id,
              title: lesson.title.trim(),
              videoUrl: lesson.videoUrl || null,
              durationSeconds: lesson.durationSeconds ?? 0,
              sortOrder: lesson.sortOrder ?? lessonIndex,
              isPreview: lesson.isPreview ?? false
            }
          })
        : await prisma.courseLesson.create({
            data: {
              sectionId: sectionRow.id,
              title: lesson.title.trim(),
              videoUrl: lesson.videoUrl || null,
              durationSeconds: lesson.durationSeconds ?? 0,
              sortOrder: lesson.sortOrder ?? lessonIndex,
              isPreview: lesson.isPreview ?? false
            }
          });

      keptLessonIds.add(lessonRow.id);
    }

    const lessonsToRemove = existingLessons.filter((lesson) => !keptLessonIds.has(lesson.id));
    if (lessonsToRemove.length) {
      await prisma.courseLesson.deleteMany({
        where: { id: { in: lessonsToRemove.map((lesson) => lesson.id) } }
      });
    }
  }

  const sectionsToRemove = existingSections.filter((section) => !keptSectionIds.has(section.id));
  if (sectionsToRemove.length) {
    await prisma.courseSection.deleteMany({
      where: { id: { in: sectionsToRemove.map((section) => section.id) } }
    });
  }

  const existingFaqs = await prisma.courseFaq.findMany({ where: { courseId } });
  const keptFaqIds = new Set<string>();
  const incomingFaqs = (faqs ?? []).filter((faq) => faq.question?.trim() && faq.answer?.trim());

  for (const [faqIndex, faq] of incomingFaqs.entries()) {
    const existingFaq = faq.id ? existingFaqs.find((row) => row.id === faq.id) : null;
    const faqRow = existingFaq
      ? await prisma.courseFaq.update({
          where: { id: existingFaq.id },
          data: {
            question: faq.question.trim(),
            answer: faq.answer.trim(),
            sortOrder: faq.sortOrder ?? faqIndex
          }
        })
      : await prisma.courseFaq.create({
          data: {
            courseId,
            question: faq.question.trim(),
            answer: faq.answer.trim(),
            sortOrder: faq.sortOrder ?? faqIndex
          }
        });
    keptFaqIds.add(faqRow.id);
  }

  const faqsToRemove = existingFaqs.filter((faq) => !keptFaqIds.has(faq.id));
  if (faqsToRemove.length) {
    await prisma.courseFaq.deleteMany({ where: { id: { in: faqsToRemove.map((faq) => faq.id) } } });
  }

  await prisma.course.update({
    where: { id: courseId },
    data: {
      lessonCount,
      durationMinutes: Math.max(1, Math.round(durationSeconds / 60))
    }
  });
}

export async function listAdminCourses() {
  const rows = await prisma.course.findMany({
    include: {
      categories: { include: { category: true } },
      _count: { select: { enrollments: true, sections: true } }
    },
    orderBy: [{ updatedAt: "desc" }]
  });

  return rows.map((course) => ({
    id: course.id,
    slug: course.slug,
    title: course.title,
    status: course.status,
    featured: course.featured,
    lessonCount: course.lessonCount,
    enrollmentCount: course._count.enrollments,
    sectionCount: course._count.sections,
    updatedAt: course.updatedAt.toISOString()
  }));
}

export async function getAdminCourseById(courseId: string) {
  return prisma.course.findUnique({
    where: { id: courseId },
    include: {
      categories: { include: { category: true } },
      sections: {
        orderBy: { sortOrder: "asc" },
        include: { lessons: { orderBy: { sortOrder: "asc" } } }
      },
      faqs: { orderBy: { sortOrder: "asc" } }
    }
  });
}

export async function createAdminCourse(input: AdminCourseInput) {
  const slug = slugifyCourse(input.slug?.trim() || input.title);
  const stats = computeCourseStats(
    (input.sections ?? []).map((section) => ({
      lessons: (section.lessons ?? []).map((lesson) => ({ durationSeconds: lesson.durationSeconds ?? 0 }))
    }))
  );

  const course = await prisma.course.create({
    data: {
      slug,
      title: input.title,
      shortDescription: input.shortDescription,
      description: input.description,
      promoVideoUrl: input.promoVideoUrl || null,
      thumbnailUrl: input.thumbnailUrl || null,
      requirements: input.requirements ?? [],
      targetAudience: input.targetAudience ?? [],
      learningObjectives: input.learningObjectives ?? [],
      includes: input.includes ?? ["Course Workbooks", "Certificate of Completion"],
      defaultRating: input.defaultRating ?? 4.8,
      defaultReviewCount: input.defaultReviewCount ?? 0,
      level: input.level ?? "beginner",
      status: input.status ?? "draft",
      featured: input.featured ?? false,
      instructorName: input.instructorName,
      instructorTitle: input.instructorTitle || null,
      instructorAvatarUrl: input.instructorAvatarUrl || null,
      instructorBio: input.instructorBio || null,
      releasedAt: input.releasedAt ? new Date(input.releasedAt) : null,
      lessonCount: stats.lessonCount,
      durationMinutes: stats.durationMinutes
    }
  });

  await syncCourseCategories(course.id, input.categorySlugs ?? []);
  await syncCourseTree(course.id, input.sections, input.faqs);
  return course;
}

export async function updateAdminCourse(courseId: string, input: AdminCourseInput) {
  const stats = computeCourseStats(
    (input.sections ?? []).map((section) => ({
      lessons: (section.lessons ?? []).map((lesson) => ({ durationSeconds: lesson.durationSeconds ?? 0 }))
    }))
  );

  const course = await prisma.course.update({
    where: { id: courseId },
    data: {
      ...(input.slug ? { slug: slugifyCourse(input.slug) } : {}),
      title: input.title,
      shortDescription: input.shortDescription,
      description: input.description,
      promoVideoUrl: input.promoVideoUrl || null,
      thumbnailUrl: input.thumbnailUrl || null,
      requirements: input.requirements ?? [],
      targetAudience: input.targetAudience ?? [],
      learningObjectives: input.learningObjectives ?? [],
      includes: input.includes ?? [],
      defaultRating: input.defaultRating ?? 4.8,
      defaultReviewCount: input.defaultReviewCount ?? 0,
      level: input.level ?? "beginner",
      status: input.status ?? "draft",
      featured: input.featured ?? false,
      instructorName: input.instructorName,
      instructorTitle: input.instructorTitle || null,
      instructorAvatarUrl: input.instructorAvatarUrl || null,
      instructorBio: input.instructorBio || null,
      releasedAt: input.releasedAt ? new Date(input.releasedAt) : null,
      lessonCount: stats.lessonCount,
      durationMinutes: stats.durationMinutes
    }
  });

  await syncCourseCategories(course.id, input.categorySlugs ?? []);
  await syncCourseTree(course.id, input.sections, input.faqs);
  return course;
}

export async function deleteAdminCourse(courseId: string) {
  await prisma.course.delete({ where: { id: courseId } });
}

export async function enrollUserInCourse(userId: string, courseId: string) {
  return prisma.courseEnrollment.create({
    data: { userId, courseId }
  });
}

export async function markLessonComplete(userId: string, courseSlug: string, lessonId: string) {
  const course = await prisma.course.findFirst({
    where: { slug: courseSlug, status: "published" },
    select: {
      id: true,
      lessonCount: true,
      sections: { select: { lessons: { select: { id: true } } } }
    }
  });

  if (!course) {
    return null;
  }

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
    select: { id: true }
  });

  if (!enrollment) {
    return null;
  }

  const validLesson = course.sections.some((section) => section.lessons.some((lesson) => lesson.id === lessonId));
  if (!validLesson) {
    return null;
  }

  await prisma.courseLessonProgress.upsert({
    where: {
      enrollmentId_lessonId: {
        enrollmentId: enrollment.id,
        lessonId
      }
    },
    update: { completedAt: new Date() },
    create: {
      enrollmentId: enrollment.id,
      lessonId
    }
  });

  const completedCount = await prisma.courseLessonProgress.count({
    where: { enrollmentId: enrollment.id }
  });

  const totalLessons = course.sections.reduce((sum, section) => sum + section.lessons.length, 0);
  const progressPercent = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;
  const completed = progressPercent >= 100;

  if (completed) {
    const now = new Date();
    const certificateNumber = `TAS-${now.getFullYear()}-${enrollment.id.slice(-10).toUpperCase()}`;
    try {
      await prisma.courseEnrollment.update({
        where: { id: enrollment.id },
        data: {
          completedAt: now,
          certificateIssuedAt: now,
          certificateNumber
        } as { completedAt: Date; certificateIssuedAt: Date; certificateNumber: string }
      });
    } catch {
      await prisma.courseEnrollment.update({
        where: { id: enrollment.id },
        data: {
          completedAt: now,
          certificateIssuedAt: now
        }
      });
    }
  }

  return { completedCount, totalLessons, progressPercent, completed };
}

export async function ensureCourseCatalogSeeded() {
  const count = await prisma.course.count();
  if (count > 0) {
    return;
  }

  await prisma.courseCategory.createMany({
    data: [
      { slug: "ai-fundamentals", name: "AI Fundamentals", sortOrder: 1 },
      { slug: "prompt-engineering", name: "Prompt Engineering", sortOrder: 2 },
      { slug: "automation", name: "Automation", sortOrder: 3 },
      { slug: "no-code", name: "No-Code", sortOrder: 4 }
    ],
    skipDuplicates: true
  });

  await createAdminCourse({
    title: "AI Website Builder Crash Course",
    shortDescription:
      "Build and launch a real website using AI tools without writing code. Plan, create, and publish a live site.",
    description:
      "This crash course walks you through planning, creating, and publishing a live website with AI tools. You will learn practical workflows for copy, layout, and launch using modern no-code stacks.",
    promoVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    requirements: ["No coding experience needed", "A laptop and internet connection"],
    targetAudience: ["Beginners who want to build without code", "Founders validating an offer", "Creators launching a service"],
    learningObjectives: [
      "Plan a conversion-focused website with AI",
      "Generate copy, sections, and layouts quickly",
      "Publish and iterate after launch"
    ],
    includes: ["Course Workbooks", "Certificate of Completion"],
    defaultRating: 4.8,
    defaultReviewCount: 4,
    level: "beginner",
    status: "published",
    featured: true,
    instructorName: "Saj Adib",
    instructorTitle: "Founder Educator",
    instructorAvatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    releasedAt: new Date("2025-12-01").toISOString(),
    categorySlugs: ["no-code", "ai-fundamentals"],
    sections: [
      {
        title: "Section 1 - Making Websites with AI",
        lessons: [
          { title: "What You Will Build in this Course", durationSeconds: 180, isPreview: true },
          { title: "The 3 Ways to Build a Website with AI", durationSeconds: 420 },
          { title: "Choosing the Right Tool", durationSeconds: 360 }
        ]
      },
      {
        title: "Section 2 - Launch & Iterate",
        lessons: [
          { title: "Publishing Your First Site", durationSeconds: 540 },
          { title: "Collecting Feedback and Improving", durationSeconds: 480 }
        ]
      }
    ],
    faqs: [
      {
        question: "Do I need to code?",
        answer: "No. This course is designed for non-technical builders using AI-assisted tools."
      },
      {
        question: "How long do I keep access?",
        answer: "You keep access while your membership plan is active."
      }
    ]
  });
}
