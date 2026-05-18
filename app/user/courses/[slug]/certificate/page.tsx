import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getCourseDetailBySlug, getUserCourseEnrollments } from "@/lib/queries/courses";
import { CertificateActions } from "@/components/courses/certificate-actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Course certificate",
  robots: { index: false, follow: false }
};

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CourseCertificatePage({ params }: Props) {
  const user = await requireUser("/user/dashboard");
  const { slug } = await params;
  const [detail, enrollments] = await Promise.all([
    getCourseDetailBySlug(slug, user.id),
    getUserCourseEnrollments(user.id)
  ]);

  if (!detail) {
    notFound();
  }

  const enrollment = enrollments.find((row) => row.slug === slug);
  if (!enrollment?.certificateReady) {
    notFound();
  }

  const issuedAt = enrollment.completedAt
    ? new Date(enrollment.completedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : new Date().toLocaleDateString();

  return (
    <div className="section-shell space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="outline">
          <Link href={`/courses/${slug}`}>Back to course</Link>
        </Button>
        <CertificateActions courseSlug={slug} />
      </div>

      <div
        id="course-certificate"
        className="mx-auto max-w-3xl rounded-2xl border bg-card p-10 text-center shadow-glow print:border-0 print:shadow-none"
      >
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">TheAiStack</p>
        <h1 className="mt-6 text-3xl font-semibold md:text-4xl">Certificate of Completion</h1>
        <p className="mt-4 text-muted-foreground">This certifies that</p>
        <p className="mt-2 text-2xl font-semibold">{user.name}</p>
        <p className="mt-6 text-muted-foreground">has successfully completed</p>
        <p className="mt-2 text-xl font-semibold">{detail.course.title}</p>
        <p className="mt-2 text-sm text-muted-foreground">Instructor · {detail.course.instructorName}</p>
        <p className="mt-8 text-sm text-muted-foreground">Issued on {issuedAt}</p>
        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Download className="h-4 w-4 print:hidden" />
          <span>Verified completion · {detail.course.lessonCount} lessons</span>
        </div>
      </div>
    </div>
  );
}
