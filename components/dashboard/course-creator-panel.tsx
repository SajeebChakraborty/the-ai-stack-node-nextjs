"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Video, BookOpen, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type LessonDraft = {
  key: string;
  title: string;
  videoUrl: string;
  durationMinutes: string;
  isPreview: boolean;
};

type SectionDraft = {
  key: string;
  title: string;
  lessons: LessonDraft[];
};

type CourseDraft = {
  title: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string;
  promoVideoUrl: string;
  priceUsd: string;
  level: "beginner" | "intermediate" | "advanced";
  requirementsText: string;
  audienceText: string;
  objectivesText: string;
  includesText: string;
  categorySlugsText: string;
  sections: SectionDraft[];
};

const emptyDraft: CourseDraft = {
  title: "",
  shortDescription: "",
  description: "",
  thumbnailUrl: "",
  promoVideoUrl: "",
  priceUsd: "29",
  level: "beginner",
  requirementsText: "",
  audienceText: "",
  objectivesText: "",
  includesText: "Self-paced video lessons\nLifetime access\nCertificate of completion",
  categorySlugsText: "",
  sections: [
    {
      key: cryptoRandom(),
      title: "Section 1 - Welcome & overview",
      lessons: [{ key: cryptoRandom(), title: "Course introduction", videoUrl: "", durationMinutes: "5", isPreview: true }]
    }
  ]
};

function cryptoRandom() {
  if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}`;
}

function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

type Settings = {
  platformFeePercent: number;
  minWithdrawalCents: number;
  currency: string;
};

export function CourseCreatorPanel({
  onCreated
}: {
  onCreated?: () => void;
}) {
  const [draft, setDraft] = useState<CourseDraft>(emptyDraft);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ tone: "ok" | "err"; message: string } | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/marketplace")
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { settings?: Settings } | null) => {
        if (!cancelled && payload?.settings) {
          setSettings(payload.settings);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  function updateSection(key: string, patch: Partial<SectionDraft>) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section) => (section.key === key ? { ...section, ...patch } : section))
    }));
  }

  function updateLesson(sectionKey: string, lessonKey: string, patch: Partial<LessonDraft>) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.key === sectionKey
          ? {
              ...section,
              lessons: section.lessons.map((lesson) => (lesson.key === lessonKey ? { ...lesson, ...patch } : lesson))
            }
          : section
      )
    }));
  }

  function addSection() {
    setDraft((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          key: cryptoRandom(),
          title: `Section ${current.sections.length + 1}`,
          lessons: [{ key: cryptoRandom(), title: "New lesson", videoUrl: "", durationMinutes: "5", isPreview: false }]
        }
      ]
    }));
  }

  function removeSection(sectionKey: string) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.filter((section) => section.key !== sectionKey)
    }));
  }

  function addLesson(sectionKey: string) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.key === sectionKey
          ? {
              ...section,
              lessons: [
                ...section.lessons,
                { key: cryptoRandom(), title: "New lesson", videoUrl: "", durationMinutes: "5", isPreview: false }
              ]
            }
          : section
      )
    }));
  }

  function removeLesson(sectionKey: string, lessonKey: string) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.key === sectionKey
          ? { ...section, lessons: section.lessons.filter((lesson) => lesson.key !== lessonKey) }
          : section
      )
    }));
  }

  async function submit() {
    setSubmitting(true);
    setStatus(null);

    const priceUsd = Number(draft.priceUsd);
    if (!Number.isFinite(priceUsd) || priceUsd < 0) {
      setStatus({ tone: "err", message: "Price must be 0 or higher." });
      setSubmitting(false);
      return;
    }

    const payload = {
      title: draft.title.trim(),
      shortDescription: draft.shortDescription.trim(),
      description: draft.description.trim(),
      thumbnailUrl: draft.thumbnailUrl.trim(),
      promoVideoUrl: draft.promoVideoUrl.trim(),
      priceUsd,
      level: draft.level,
      categorySlugs: draft.categorySlugsText
        .split(",")
        .map((slug) => slug.trim().toLowerCase().replace(/\s+/g, "-"))
        .filter(Boolean),
      requirements: parseLines(draft.requirementsText),
      targetAudience: parseLines(draft.audienceText),
      learningObjectives: parseLines(draft.objectivesText),
      includes: parseLines(draft.includesText),
      sections: draft.sections
        .filter((section) => section.title.trim())
        .map((section) => ({
          title: section.title.trim(),
          lessons: section.lessons
            .filter((lesson) => lesson.title.trim())
            .map((lesson) => ({
              title: lesson.title.trim(),
              videoUrl: lesson.videoUrl.trim() || undefined,
              durationSeconds: Math.round(Math.max(0, Number(lesson.durationMinutes) || 0) * 60),
              isPreview: lesson.isPreview
            }))
        }))
    };

    try {
      const response = await fetch("/api/user/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as { course?: { id: string; slug: string }; error?: string };

      if (!response.ok) {
        setStatus({ tone: "err", message: data.error ?? "Could not create the course." });
      } else {
        setStatus({ tone: "ok", message: "Course published. Buyers can now find it on /courses." });
        setDraft({ ...emptyDraft, sections: emptyDraft.sections.map((section) => ({ ...section, key: cryptoRandom() })) });
        onCreated?.();
      }
    } catch {
      setStatus({ tone: "err", message: "Network error while publishing." });
    } finally {
      setSubmitting(false);
    }
  }

  const priceNumber = Number(draft.priceUsd) || 0;
  const platformFeePercent = settings?.platformFeePercent ?? 10;
  const platformFeeUsd = (priceNumber * platformFeePercent) / 100;
  const creatorEarningUsd = Math.max(0, priceNumber - platformFeeUsd);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Course studio</p>
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Launch a paid (or free) course</h2>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
          Add your sections and lessons, set a one-time price, and publish to the public catalog. Buyers pay through
          Stripe — your share lands in your connected Stripe account automatically.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Basics
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2 grid gap-2">
            <label className="text-sm font-medium" htmlFor="course-title">
              Course title
            </label>
            <Input
              id="course-title"
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              placeholder="The AI Automation Crash Course"
            />
          </div>
          <div className="md:col-span-2 grid gap-2">
            <label className="text-sm font-medium" htmlFor="course-short">
              One-line description
            </label>
            <Input
              id="course-short"
              value={draft.shortDescription}
              onChange={(event) => setDraft((current) => ({ ...current, shortDescription: event.target.value }))}
              placeholder="Ship 5 production automations in 90 minutes with modern AI tooling."
            />
          </div>
          <div className="md:col-span-2 grid gap-2">
            <label className="text-sm font-medium" htmlFor="course-description">
              Full description
            </label>
            <Textarea
              id="course-description"
              rows={6}
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              placeholder="What learners will build, who it's for, and the outcomes they should expect..."
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="course-thumb">
              Thumbnail URL (optional)
            </label>
            <Input
              id="course-thumb"
              value={draft.thumbnailUrl}
              onChange={(event) => setDraft((current) => ({ ...current, thumbnailUrl: event.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="course-promo">
              Promo video URL (optional)
            </label>
            <Input
              id="course-promo"
              value={draft.promoVideoUrl}
              onChange={(event) => setDraft((current) => ({ ...current, promoVideoUrl: event.target.value }))}
              placeholder="https://youtube.com/..."
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Level</label>
            <Select
              value={draft.level}
              onValueChange={(value) =>
                setDraft((current) => ({ ...current, level: value as CourseDraft["level"] }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="course-categories">
              Category slugs (comma-separated)
            </label>
            <Input
              id="course-categories"
              value={draft.categorySlugsText}
              onChange={(event) => setDraft((current) => ({ ...current, categorySlugsText: event.target.value }))}
              placeholder="ai-fundamentals, automation"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="course-price">
              One-time price (USD)
            </label>
            <Input
              id="course-price"
              type="number"
              min="0"
              max="5000"
              step="0.01"
              value={draft.priceUsd}
              onChange={(event) => setDraft((current) => ({ ...current, priceUsd: event.target.value }))}
            />
            <p className="text-xs text-muted-foreground">Set to 0 for a free course.</p>
          </div>
          <div className="grid gap-2 rounded-md border bg-muted/40 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Buyer pays</span>
              <span className="font-semibold">${priceNumber.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Platform fee ({platformFeePercent}%)</span>
              <span>−${platformFeeUsd.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2 font-semibold">
              <span>You earn per sale</span>
              <span className="text-primary">${creatorEarningUsd.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Curriculum
          </CardTitle>
          <p className="text-sm text-muted-foreground">Add sections and lessons. Mark a lesson as preview to let buyers sample it.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {draft.sections.map((section, sectionIndex) => (
            <div key={section.key} className="rounded-lg border p-4">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <Badge variant="secondary">Section {sectionIndex + 1}</Badge>
                <Input
                  className="flex-1 min-w-[200px]"
                  value={section.title}
                  onChange={(event) => updateSection(section.key, { title: event.target.value })}
                  placeholder="Section title"
                />
                {draft.sections.length > 1 ? (
                  <Button variant="ghost" size="sm" onClick={() => removeSection(section.key)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Remove
                  </Button>
                ) : null}
              </div>
              <div className="space-y-3">
                {section.lessons.map((lesson, lessonIndex) => (
                  <div key={lesson.key} className="grid gap-2 rounded-md border bg-muted/30 p-3 md:grid-cols-[40px_1.5fr_1fr_120px_120px_auto] md:items-center">
                    <Badge variant="outline" className="h-7 justify-center">
                      {lessonIndex + 1}
                    </Badge>
                    <Input
                      value={lesson.title}
                      onChange={(event) => updateLesson(section.key, lesson.key, { title: event.target.value })}
                      placeholder="Lesson title"
                    />
                    <Input
                      value={lesson.videoUrl}
                      onChange={(event) => updateLesson(section.key, lesson.key, { videoUrl: event.target.value })}
                      placeholder="Video URL (YouTube/Vimeo)"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={lesson.durationMinutes}
                      onChange={(event) => updateLesson(section.key, lesson.key, { durationMinutes: event.target.value })}
                      placeholder="Min"
                    />
                    <label className="flex items-center justify-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={lesson.isPreview}
                        onChange={(event) => updateLesson(section.key, lesson.key, { isPreview: event.target.checked })}
                      />
                      Preview
                    </label>
                    {section.lessons.length > 1 ? (
                      <Button variant="ghost" size="sm" onClick={() => removeLesson(section.key, lesson.key)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span />
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addLesson(section.key)}>
                  <Plus className="mr-2 h-4 w-4" /> Add lesson
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addSection}>
            <Plus className="mr-2 h-4 w-4" /> Add section
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Course details (one item per line)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="course-req">
              Requirements
            </label>
            <Textarea
              id="course-req"
              rows={4}
              value={draft.requirementsText}
              onChange={(event) => setDraft((current) => ({ ...current, requirementsText: event.target.value }))}
              placeholder="Laptop + internet&#10;Basic English"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="course-audience">
              Who it&apos;s for
            </label>
            <Textarea
              id="course-audience"
              rows={4}
              value={draft.audienceText}
              onChange={(event) => setDraft((current) => ({ ...current, audienceText: event.target.value }))}
              placeholder="Founders&#10;Indie builders&#10;Product teams"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="course-objectives">
              Learning objectives
            </label>
            <Textarea
              id="course-objectives"
              rows={4}
              value={draft.objectivesText}
              onChange={(event) => setDraft((current) => ({ ...current, objectivesText: event.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="course-includes">
              What&apos;s included
            </label>
            <Textarea
              id="course-includes"
              rows={4}
              value={draft.includesText}
              onChange={(event) => setDraft((current) => ({ ...current, includesText: event.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {status ? (
        <p
          className={`rounded-md border p-3 text-sm ${
            status.tone === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {status.message}
        </p>
      ) : null}

      <div className="sticky bottom-0 -mx-5 flex items-center justify-end gap-3 border-t bg-background/95 px-5 py-4 backdrop-blur md:-mx-8 md:px-8">
        <Button onClick={submit} disabled={submitting} size="lg">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...
            </>
          ) : (
            "Publish course"
          )}
        </Button>
      </div>
    </div>
  );
}
