import "server-only";

import { getFounderActivePlan } from "@/lib/founders/entitlements";
import { getPublishedPremiumPlans } from "@/lib/queries/plans";
import { parseCourseLimitFromLimits } from "@/lib/plans/limits";
import { prisma } from "@/lib/db/prisma";

export type CourseEntitlements = {
  planId: string;
  planName: string;
  courseLimit: number | null;
  enrollmentsUsed: number;
  canEnrollMore: boolean;
};

export async function countActiveCourseEnrollments(userId: string) {
  return prisma.courseEnrollment.count({
    where: { userId }
  });
}

export async function getCourseEntitlements(userId: string): Promise<CourseEntitlements> {
  const [subscription, publishedPlans, enrollmentsUsed] = await Promise.all([
    getFounderActivePlan(userId),
    getPublishedPremiumPlans(),
    countActiveCourseEnrollments(userId)
  ]);

  const freePlan = publishedPlans.find((plan) => plan.id === "free");
  const plan = subscription?.plan ?? null;
  const matchedPlan = plan ? publishedPlans.find((item) => item.id === plan.id) : freePlan;
  const limits = matchedPlan?.limits ?? freePlan?.limits ?? { courses: 0 };
  const courseLimit = parseCourseLimitFromLimits(limits);
  const canEnrollMore = courseLimit === null || enrollmentsUsed < courseLimit;

  return {
    planId: matchedPlan?.id ?? "free",
    planName: matchedPlan?.name ?? "Free",
    courseLimit,
    enrollmentsUsed,
    canEnrollMore
  };
}

export async function assertUserCanEnrollCourse(userId: string, courseId: string) {
  const existing = await prisma.courseEnrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId
      }
    },
    select: { id: true }
  });

  if (existing) {
    return { ok: true as const, alreadyEnrolled: true };
  }

  const entitlements = await getCourseEntitlements(userId);

  if (!entitlements.canEnrollMore) {
    return {
      ok: false as const,
      code: "COURSE_LIMIT_REACHED" as const,
      entitlements
    };
  }

  return { ok: true as const, alreadyEnrolled: false, entitlements };
}
