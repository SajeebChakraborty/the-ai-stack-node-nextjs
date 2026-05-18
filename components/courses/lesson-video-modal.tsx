"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { CourseLessonView } from "@/types/course";
import { getLessonVideoPlayer } from "@/lib/courses/video";
import { Button } from "@/components/ui/button";

type Props = {
  lesson: CourseLessonView | null;
  onClose: () => void;
};

export function LessonVideoModal({ lesson, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const open = Boolean(lesson);
  const player = lesson ? getLessonVideoPlayer(lesson.videoUrl) : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  function handleBackdropMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  if (!mounted || !open || !lesson) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex min-h-[100dvh] flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={lesson.title}
      onMouseDown={handleBackdropMouseDown}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{lesson.title}</p>
          <p className="text-xs text-white/60">{lesson.durationLabel}</p>
        </div>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="shrink-0 rounded-full bg-white/10 text-white hover:bg-white/20"
          onClick={onClose}
          aria-label="Close video"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="relative min-h-0 flex-1">
        {player ? (
          player.kind === "iframe" ? (
            <iframe
              src={player.src}
              title={lesson.title}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={player.src}
              title={lesson.title}
              className="absolute inset-0 h-full w-full bg-black object-contain"
              controls
              autoPlay
              playsInline
            />
          )
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/70">
            No video URL is set for this lesson yet.
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
