"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { CourseLevel, CourseStatus } from "@/types/course";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AdminCourseCurriculumEditor,
  emptySection,
  parseSectionsFromApi,
  sectionsToApiPayload,
  type SectionFormRow
} from "@/components/admin/admin-course-curriculum-editor";
import {
  AdminCourseFaqEditor,
  emptyFaq,
  faqsToApiPayload,
  parseFaqsFromApi,
  type FaqFormRow
} from "@/components/admin/admin-course-faq-editor";

type AdminCourseRow = {
  id: string;
  slug: string;
  title: string;
  status: CourseStatus;
  featured: boolean;
  lessonCount: number;
  enrollmentCount: number;
  sectionCount: number;
  updatedAt: string;
};

type CategoryOption = { slug: string; name: string };

type CourseForm = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  promoVideoUrl: string;
  thumbnailUrl: string;
  requirementsText: string;
  targetAudienceText: string;
  learningObjectivesText: string;
  includesText: string;
  defaultRating: string;
  defaultReviewCount: string;
  level: CourseLevel;
  status: CourseStatus;
  featured: boolean;
  instructorName: string;
  instructorTitle: string;
  instructorAvatarUrl: string;
  instructorBio: string;
  releasedAt: string;
  categorySlugsText: string;
  sections: SectionFormRow[];
  faqs: FaqFormRow[];
};

const emptyForm = (): CourseForm => ({
  slug: "",
  title: "",
  shortDescription: "",
  description: "",
  promoVideoUrl: "",
  thumbnailUrl: "",
  requirementsText: "",
  targetAudienceText: "",
  learningObjectivesText: "",
  includesText: "Course Workbooks\nCertificate of Completion",
  defaultRating: "4.8",
  defaultReviewCount: "0",
  level: "beginner",
  status: "draft",
  featured: false,
  instructorName: "",
  instructorTitle: "",
  instructorAvatarUrl: "",
  instructorBio: "",
  releasedAt: "",
  categorySlugsText: "",
  sections: [emptySection()],
  faqs: [emptyFaq()]
});

function linesToList(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function listToLines(value: unknown) {
  if (!Array.isArray(value)) {
    return "";
  }
  return value.map(String).join("\n");
}

function courseToForm(course: Record<string, unknown>): CourseForm {
  const categories = Array.isArray(course.categories)
    ? course.categories.map((item) => {
        const row = item as { category?: { slug?: string } };
        return row.category?.slug ?? "";
      })
    : [];

  return {
    slug: String(course.slug ?? ""),
    title: String(course.title ?? ""),
    shortDescription: String(course.shortDescription ?? ""),
    description: String(course.description ?? ""),
    promoVideoUrl: String(course.promoVideoUrl ?? ""),
    thumbnailUrl: String(course.thumbnailUrl ?? ""),
    requirementsText: listToLines(course.requirements),
    targetAudienceText: listToLines(course.targetAudience),
    learningObjectivesText: listToLines(course.learningObjectives),
    includesText: listToLines(course.includes) || "Course Workbooks\nCertificate of Completion",
    defaultRating: String(course.defaultRating ?? "4.8"),
    defaultReviewCount: String(course.defaultReviewCount ?? "0"),
    level: (course.level as CourseLevel) ?? "beginner",
    status: (course.status as CourseStatus) ?? "draft",
    featured: Boolean(course.featured),
    instructorName: String(course.instructorName ?? ""),
    instructorTitle: String(course.instructorTitle ?? ""),
    instructorAvatarUrl: String(course.instructorAvatarUrl ?? ""),
    instructorBio: String(course.instructorBio ?? ""),
    releasedAt: course.releasedAt ? String(course.releasedAt).slice(0, 10) : "",
    categorySlugsText: categories.filter(Boolean).join("\n"),
    sections: parseSectionsFromApi(course.sections),
    faqs: parseFaqsFromApi(course.faqs)
  };
}

function formToPayload(form: CourseForm) {
  const sections = sectionsToApiPayload(form.sections);
  const faqs = faqsToApiPayload(form.faqs);

  if (!sections.length) {
    throw new Error("Add at least one section with at least one lesson.");
  }

  return {
    slug: form.slug.trim() || undefined,
    title: form.title.trim(),
    shortDescription: form.shortDescription.trim(),
    description: form.description.trim(),
    promoVideoUrl: form.promoVideoUrl.trim() || undefined,
    thumbnailUrl: form.thumbnailUrl.trim() || undefined,
    requirements: linesToList(form.requirementsText),
    targetAudience: linesToList(form.targetAudienceText),
    learningObjectives: linesToList(form.learningObjectivesText),
    includes: linesToList(form.includesText),
    defaultRating: Number(form.defaultRating),
    defaultReviewCount: Number(form.defaultReviewCount),
    level: form.level,
    status: form.status,
    featured: form.featured,
    instructorName: form.instructorName.trim(),
    instructorTitle: form.instructorTitle.trim() || undefined,
    instructorAvatarUrl: form.instructorAvatarUrl.trim() || undefined,
    instructorBio: form.instructorBio.trim() || undefined,
    releasedAt: form.releasedAt ? form.releasedAt : null,
    categorySlugs: linesToList(form.categorySlugsText),
    sections,
    faqs
  };
}

export function AdminCoursesPanel() {
  const router = useRouter();
  const [courses, setCourses] = useState<AdminCourseRow[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CourseForm>(() => emptyForm());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/courses");
      const payload = (await response.json()) as { courses?: AdminCourseRow[] };
      setCourses(payload.courses ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
    void fetch("/api/courses?filtersOnly=true")
      .then((response) => response.json())
      .then((payload: { categories?: CategoryOption[] }) => setCategories(payload.categories ?? []))
      .catch(() => undefined);
  }, [loadCourses]);

  const filtered = useMemo(
    () => courses.filter((course) => course.title.toLowerCase().includes(query.toLowerCase())),
    [courses, query]
  );

  function startCreate() {
    setCreating(true);
    setEditingId(null);
    setForm(emptyForm());
    setStatusMessage(null);
  }

  async function startEdit(courseId: string) {
    setCreating(false);
    setEditingId(courseId);
    setStatusMessage(null);

    const response = await fetch(`/api/admin/courses/${courseId}`);
    const payload = (await response.json()) as { course?: Record<string, unknown> };
    if (payload.course) {
      setForm(courseToForm(payload.course));
    }
  }

  async function saveCourse() {
    setSaving(true);
    setStatusMessage(null);

    try {
      const body = formToPayload(form);
      const response = await fetch(editingId ? `/api/admin/courses/${editingId}` : "/api/admin/courses", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not save course.");
      }

      setStatusMessage(editingId ? "Course updated." : "Course created.");
      setCreating(false);
      setEditingId(null);
      setForm(emptyForm());
      await loadCourses();
      router.refresh();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Could not save course.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCourse(courseId: string) {
    if (!window.confirm("Delete this course and all enrollments?")) {
      return;
    }

    const response = await fetch(`/api/admin/courses/${courseId}`, { method: "DELETE" });
    if (response.ok) {
      await loadCourses();
      router.refresh();
    }
  }

  const showEditor = creating || Boolean(editingId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Course management</h2>
          <p className="text-sm text-muted-foreground">Create, publish, and maintain curriculum, FAQs, and default ratings.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void loadCourses()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={startCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New course
          </Button>
        </div>
      </div>

      {statusMessage ? <p className="text-sm text-muted-foreground">{statusMessage}</p> : null}

      {showEditor ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit course" : "Create course"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="course-title">
                  Course title
                </label>
                <Input
                  id="course-title"
                  placeholder="AI Website Builder Crash Course"
                  value={form.title}
                  onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="course-slug">
                  Slug
                </label>
                <Input
                  id="course-slug"
                  placeholder="ai-website-builder-crash-course"
                  value={form.slug}
                  onChange={(e) => setForm((c) => ({ ...c, slug: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="course-short-description">
                Short description
              </label>
              <Textarea
                id="course-short-description"
                placeholder="One-line summary shown on the course card"
                value={form.shortDescription}
                onChange={(e) => setForm((c) => ({ ...c, shortDescription: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="course-description">
                Full description
              </label>
              <Textarea
                id="course-description"
                placeholder="Detailed course overview on the detail page"
                rows={5}
                value={form.description}
                onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="course-promo-video">
                  Promo video URL
                </label>
                <Input
                  id="course-promo-video"
                  placeholder="https://www.youtube.com/embed/..."
                  value={form.promoVideoUrl}
                  onChange={(e) => setForm((c) => ({ ...c, promoVideoUrl: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="course-thumbnail">
                  Thumbnail image URL
                </label>
                <Input
                  id="course-thumbnail"
                  placeholder="https://..."
                  value={form.thumbnailUrl}
                  onChange={(e) => setForm((c) => ({ ...c, thumbnailUrl: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="course-level">
                  Difficulty level
                </label>
                <Select value={form.level} onValueChange={(value) => setForm((c) => ({ ...c, level: value as CourseLevel }))}>
                  <SelectTrigger id="course-level">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="course-status">
                  Status
                </label>
                <Select value={form.status} onValueChange={(value) => setForm((c) => ({ ...c, status: value as CourseStatus }))}>
                  <SelectTrigger id="course-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="course-released-at">
                  Release date
                </label>
                <Input
                  id="course-released-at"
                  type="date"
                  value={form.releasedAt}
                  onChange={(e) => setForm((c) => ({ ...c, releasedAt: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="course-default-rating">
                  Default rating (1–5)
                </label>
                <Input
                  id="course-default-rating"
                  placeholder="4.8"
                  value={form.defaultRating}
                  onChange={(e) => setForm((c) => ({ ...c, defaultRating: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="course-default-review-count">
                  Default review count
                </label>
                <Input
                  id="course-default-review-count"
                  placeholder="4"
                  value={form.defaultReviewCount}
                  onChange={(e) => setForm((c) => ({ ...c, defaultReviewCount: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="course-instructor-name">
                  Instructor name
                </label>
                <Input
                  id="course-instructor-name"
                  placeholder="Saj Adib"
                  value={form.instructorName}
                  onChange={(e) => setForm((c) => ({ ...c, instructorName: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="course-instructor-title">
                  Instructor title
                </label>
                <Input
                  id="course-instructor-title"
                  placeholder="Founder Educator"
                  value={form.instructorTitle}
                  onChange={(e) => setForm((c) => ({ ...c, instructorTitle: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="course-instructor-avatar">
                Instructor avatar URL
              </label>
              <Input
                id="course-instructor-avatar"
                placeholder="https://..."
                value={form.instructorAvatarUrl}
                onChange={(e) => setForm((c) => ({ ...c, instructorAvatarUrl: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="course-categories">
                Category slugs
              </label>
              <Textarea
                id="course-categories"
                placeholder="One slug per line (e.g. no-code)"
                value={form.categorySlugsText}
                onChange={(e) => setForm((c) => ({ ...c, categorySlugsText: e.target.value }))}
              />
            </div>
            {categories.length ? (
              <p className="text-xs text-muted-foreground">
                Available categories: {categories.map((item) => item.slug).join(", ")}
              </p>
            ) : null}
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="course-requirements">
                Requirements
              </label>
              <Textarea
                id="course-requirements"
                placeholder="One requirement per line"
                value={form.requirementsText}
                onChange={(e) => setForm((c) => ({ ...c, requirementsText: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="course-target-audience">
                Who this course is for
              </label>
              <Textarea
                id="course-target-audience"
                placeholder="One audience line per row"
                value={form.targetAudienceText}
                onChange={(e) => setForm((c) => ({ ...c, targetAudienceText: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="course-learning-objectives">
                Learning objectives
              </label>
              <Textarea
                id="course-learning-objectives"
                placeholder="One objective per line"
                value={form.learningObjectivesText}
                onChange={(e) => setForm((c) => ({ ...c, learningObjectivesText: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="course-includes">
                This course includes
              </label>
              <Textarea
                id="course-includes"
                placeholder="One item per line (e.g. Certificate of Completion)"
                value={form.includesText}
                onChange={(e) => setForm((c) => ({ ...c, includesText: e.target.value }))}
              />
            </div>
            <AdminCourseCurriculumEditor
              sections={form.sections}
              onChange={(sections) => setForm((c) => ({ ...c, sections }))}
            />
            <AdminCourseFaqEditor faqs={form.faqs} onChange={(faqs) => setForm((c) => ({ ...c, faqs }))} />
            <label className="flex items-center gap-2 rounded-md border p-4 text-sm font-medium">
              <Switch checked={form.featured} onCheckedChange={(checked) => setForm((c) => ({ ...c, featured: checked }))} />
              Featured course
            </label>
            <div className="flex gap-2">
              <Button disabled={saving} onClick={() => void saveCourse()}>
                {saving ? "Saving..." : "Save course"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCreating(false);
                  setEditingId(null);
                  setForm(emptyForm());
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>All courses</CardTitle>
          <Input placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" />
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-muted-foreground">Loading courses...</p> : null}
          {!loading && filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No courses yet. Create your first course.</p>
          ) : null}
          {filtered.map((course) => (
            <div key={course.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
              <div>
                <p className="font-medium">{course.title}</p>
                <p className="text-sm text-muted-foreground">
                  /courses/{course.slug} · {course.lessonCount} lessons · {course.enrollmentCount} enrollments
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={course.status === "published" ? "verified" : "secondary"}>{course.status}</Badge>
                {course.featured ? <Badge variant="premium">Featured</Badge> : null}
                <Button size="sm" variant="outline" onClick={() => void startEdit(course.id)}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => void deleteCourse(course.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}


