export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseStatus = "draft" | "published" | "archived";

export type CourseLessonView = {
  id: string;
  title: string;
  videoUrl: string | null;
  durationSeconds: number;
  durationLabel: string;
  sortOrder: number;
  isPreview: boolean;
  completed?: boolean;
  locked?: boolean;
};

export type CourseSectionView = {
  id: string;
  title: string;
  sortOrder: number;
  durationLabel: string;
  lessons: CourseLessonView[];
};

export type CourseFaqView = {
  id: string;
  question: string;
  answer: string;
};

export type CourseReviewView = {
  id: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
};

export type CourseListItem = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  thumbnailUrl: string | null;
  level: CourseLevel;
  durationMinutes: number;
  durationLabel: string;
  lessonCount: number;
  rating: number;
  reviewCount: number;
  instructorName: string;
  categories: string[];
  featured: boolean;
  releasedLabel: string | null;
  promoVideoUrl: string | null;
};

export type CourseDetail = CourseListItem & {
  description: string;
  promoVideoUrl: string | null;
  requirements: string[];
  targetAudience: string[];
  learningObjectives: string[];
  includes: string[];
  instructorTitle: string | null;
  instructorAvatarUrl: string | null;
  instructorBio: string | null;
  sections: CourseSectionView[];
  faqs: CourseFaqView[];
  reviews: CourseReviewView[];
  enrolled: boolean;
  completed: boolean;
  progressPercent: number;
  completedLessons: number;
};

export type CourseEnrollmentSummary = {
  enrollmentId: string;
  courseId: string;
  slug: string;
  title: string;
  thumbnailUrl: string | null;
  instructorName: string;
  lessonCount: number;
  completedLessons: number;
  progressPercent: number;
  completed: boolean;
  certificateReady: boolean;
  enrolledAt: string;
  completedAt: string | null;
};
