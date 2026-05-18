import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  ensureEnrollmentCertificateNumber,
  generateCourseCertificatePdf,
  getCertificateVerifyUrl
} from "@/lib/courses/certificate";
import { prisma } from "@/lib/db/prisma";

type Props = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Props) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to download your certificate." }, { status: 401 });
    }

    const { slug } = await params;

    const course = await prisma.course.findFirst({
      where: { slug, status: "published" },
      select: { id: true, title: true, instructorName: true, lessonCount: true }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id
        }
      },
      include: {
        lessonProgress: { select: { lessonId: true } }
      }
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Enroll in this course to earn a certificate." }, { status: 403 });
    }

    const completedLessons = enrollment.lessonProgress.length;
    const progressComplete =
      course.lessonCount > 0 && completedLessons >= course.lessonCount;
    const certificateEligible =
      Boolean(enrollment.completedAt) ||
      Boolean(enrollment.certificateIssuedAt) ||
      progressComplete;

    if (!certificateEligible) {
      return NextResponse.json(
        { error: "Complete all lessons to unlock your certificate." },
        { status: 403 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { fullName: true, email: true }
    });

    const certificateNumber = await ensureEnrollmentCertificateNumber(enrollment.id);
    if (!certificateNumber) {
      return NextResponse.json({ error: "Could not issue certificate." }, { status: 500 });
    }

    const completedAt =
      enrollment.completedAt ?? enrollment.certificateIssuedAt ?? new Date();

    if (!enrollment.completedAt || !enrollment.certificateIssuedAt) {
      try {
        await prisma.courseEnrollment.update({
          where: { id: enrollment.id },
          data: {
            completedAt: enrollment.completedAt ?? completedAt,
            certificateIssuedAt: enrollment.certificateIssuedAt ?? completedAt,
            certificateNumber
          } as {
            completedAt: Date;
            certificateIssuedAt: Date;
            certificateNumber: string;
          }
        });
      } catch {
        await prisma.courseEnrollment.update({
          where: { id: enrollment.id },
          data: {
            completedAt: enrollment.completedAt ?? completedAt,
            certificateIssuedAt: enrollment.certificateIssuedAt ?? completedAt
          }
        });
      }
    }

    const pdf = await generateCourseCertificatePdf({
      recipientName: profile?.fullName ?? user.name,
      recipientEmail: profile?.email ?? user.email,
      courseTitle: course.title,
      instructorName: course.instructorName,
      certificateNumber,
      enrolledAt: enrollment.enrolledAt,
      completedAt,
      verifyUrl: getCertificateVerifyUrl(certificateNumber)
    });

    const filename = `TheAiStack-${slug}-certificate.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store"
      }
    });
  } catch (error) {
    console.error("[certificate-download]", error);
    const message =
      error instanceof Error ? error.message : "Could not generate certificate PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
