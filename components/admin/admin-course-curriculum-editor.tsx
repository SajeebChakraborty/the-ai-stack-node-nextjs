"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export type LessonFormRow = {
  key: string;
  title: string;
  videoUrl: string;
  durationSeconds: string;
  isPreview: boolean;
};

export type SectionFormRow = {
  key: string;
  title: string;
  lessons: LessonFormRow[];
};

function newKey() {
  return `k-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isPersistedKey(key: string) {
  return !key.startsWith("k-");
}

export function emptyLesson(): LessonFormRow {
  return {
    key: newKey(),
    title: "",
    videoUrl: "",
    durationSeconds: "120",
    isPreview: false
  };
}

export function emptySection(): SectionFormRow {
  return {
    key: newKey(),
    title: "",
    lessons: [emptyLesson()]
  };
}

export function parseSectionsFromApi(sections: unknown): SectionFormRow[] {
  if (!Array.isArray(sections) || sections.length === 0) {
    return [emptySection()];
  }

  return sections.map((raw) => {
    const section = raw as {
      id?: string;
      title?: string;
      lessons?: Array<{
        id?: string;
        title?: string;
        videoUrl?: string | null;
        durationSeconds?: number;
        isPreview?: boolean;
      }>;
    };

    const lessons =
      Array.isArray(section.lessons) && section.lessons.length > 0
        ? section.lessons.map((lesson) => ({
            key: lesson.id ? String(lesson.id) : newKey(),
            title: String(lesson.title ?? ""),
            videoUrl: String(lesson.videoUrl ?? ""),
            durationSeconds: String(lesson.durationSeconds ?? 0),
            isPreview: Boolean(lesson.isPreview)
          }))
        : [emptyLesson()];

    return {
      key: section.id ? String(section.id) : newKey(),
      title: String(section.title ?? ""),
      lessons
    };
  });
}

export function sectionsToApiPayload(sections: SectionFormRow[]) {
  return sections
    .map((section, sectionIndex) => ({
      ...(isPersistedKey(section.key) ? { id: section.key } : {}),
      title: section.title.trim(),
      sortOrder: sectionIndex,
      lessons: section.lessons
        .map((lesson, lessonIndex) => ({
          ...(isPersistedKey(lesson.key) ? { id: lesson.key } : {}),
          title: lesson.title.trim(),
          videoUrl: lesson.videoUrl.trim() || undefined,
          durationSeconds: Math.max(0, Number.parseInt(lesson.durationSeconds, 10) || 0),
          sortOrder: lessonIndex,
          isPreview: lesson.isPreview
        }))
        .filter((lesson) => lesson.title.length > 0)
    }))
    .filter((section) => section.title.length > 0 && section.lessons.length > 0);
}

type Props = {
  sections: SectionFormRow[];
  onChange: (sections: SectionFormRow[]) => void;
};

export function AdminCourseCurriculumEditor({ sections, onChange }: Props) {
  function updateSection(sectionKey: string, patch: Partial<SectionFormRow>) {
    onChange(sections.map((section) => (section.key === sectionKey ? { ...section, ...patch } : section)));
  }

  function removeSection(sectionKey: string) {
    const next = sections.filter((section) => section.key !== sectionKey);
    onChange(next.length ? next : [emptySection()]);
  }

  function addSection() {
    onChange([...sections, emptySection()]);
  }

  function updateLesson(sectionKey: string, lessonKey: string, patch: Partial<LessonFormRow>) {
    onChange(
      sections.map((section) => {
        if (section.key !== sectionKey) {
          return section;
        }
        return {
          ...section,
          lessons: section.lessons.map((lesson) => (lesson.key === lessonKey ? { ...lesson, ...patch } : lesson))
        };
      })
    );
  }

  function addLesson(sectionKey: string) {
    onChange(
      sections.map((section) =>
        section.key === sectionKey ? { ...section, lessons: [...section.lessons, emptyLesson()] } : section
      )
    );
  }

  function removeLesson(sectionKey: string, lessonKey: string) {
    onChange(
      sections.map((section) => {
        if (section.key !== sectionKey) {
          return section;
        }
        const lessons = section.lessons.filter((lesson) => lesson.key !== lessonKey);
        return { ...section, lessons: lessons.length ? lessons : [emptyLesson()] };
      })
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Curriculum</p>
          <p className="text-xs text-muted-foreground">Add sections, then lessons with video URLs and duration.</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={addSection}>
          <Plus className="mr-2 h-4 w-4" />
          Add section
        </Button>
      </div>

      {sections.map((section, sectionIndex) => (
        <div key={section.key} className="space-y-3 rounded-lg border bg-secondary/20 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1 grid gap-2">
              <label className="text-sm font-medium" htmlFor={`section-title-${section.key}`}>
                Section {sectionIndex + 1} title
              </label>
              <Input
                id={`section-title-${section.key}`}
                placeholder="Section 1 — Getting started"
                value={section.title}
                onChange={(e) => updateSection(section.key, { title: e.target.value })}
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0 text-destructive hover:text-destructive"
              onClick={() => removeSection(section.key)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove section
            </Button>
          </div>

          <div className="space-y-3 pl-0 md:pl-3">
            {section.lessons.map((lesson, lessonIndex) => (
              <div key={lesson.key} className="space-y-3 rounded-md border bg-background p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Lesson {lessonIndex + 1}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 text-destructive hover:text-destructive"
                    onClick={() => removeLesson(section.key, lesson.key)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="grid gap-2 md:col-span-2">
                    <label className="text-sm font-medium" htmlFor={`lesson-title-${lesson.key}`}>
                      Lesson title
                    </label>
                    <Input
                      id={`lesson-title-${lesson.key}`}
                      placeholder="What you will build"
                      value={lesson.title}
                      onChange={(e) => updateLesson(section.key, lesson.key, { title: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <label className="text-sm font-medium" htmlFor={`lesson-video-${lesson.key}`}>
                      Video URL
                    </label>
                    <Input
                      id={`lesson-video-${lesson.key}`}
                      placeholder="https://www.youtube.com/embed/..."
                      value={lesson.videoUrl}
                      onChange={(e) => updateLesson(section.key, lesson.key, { videoUrl: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor={`lesson-duration-${lesson.key}`}>
                      Duration (seconds)
                    </label>
                    <Input
                      id={`lesson-duration-${lesson.key}`}
                      type="number"
                      min={0}
                      placeholder="180"
                      value={lesson.durationSeconds}
                      onChange={(e) => updateLesson(section.key, lesson.key, { durationSeconds: e.target.value })}
                    />
                  </div>
                  <label className="flex items-center gap-2 self-end rounded-md border px-3 py-2 text-sm">
                    <Switch
                      checked={lesson.isPreview}
                      onCheckedChange={(checked) => updateLesson(section.key, lesson.key, { isPreview: checked })}
                    />
                    Free preview lesson
                  </label>
                </div>
              </div>
            ))}
            <Button type="button" size="sm" variant="secondary" onClick={() => addLesson(section.key)}>
              <Plus className="mr-2 h-4 w-4" />
              Add lesson
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
