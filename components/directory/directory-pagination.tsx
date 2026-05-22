"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Generate the visible page numbers (with ellipsis sentinels as "..." strings).
 *
 * Always shows: first, last, current, current ± siblings.
 * Fills the gap with "..." sentinels when there's more than one number skipped.
 */
function buildPageRange(currentPage: number, totalPages: number, siblings = 1): Array<number | "..."> {
  const range: Array<number | "..."> = [];

  if (totalPages <= 1) return [1];

  const showLeftDots = currentPage - siblings > 2;
  const showRightDots = currentPage + siblings < totalPages - 1;

  range.push(1);

  if (showLeftDots) {
    range.push("...");
  }

  const start = Math.max(2, currentPage - siblings);
  const end = Math.min(totalPages - 1, currentPage + siblings);
  for (let page = start; page <= end; page += 1) {
    range.push(page);
  }

  if (showRightDots) {
    range.push("...");
  }

  if (totalPages > 1) {
    range.push(totalPages);
  }

  return range;
}

type DirectoryPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

export function DirectoryPagination({
  page,
  totalPages,
  onPageChange,
  disabled
}: DirectoryPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPageRange(page, totalPages, 1);
  const canPrev = page > 1 && !disabled;
  const canNext = page < totalPages && !disabled;

  function go(target: number) {
    if (disabled) return;
    const clamped = Math.min(totalPages, Math.max(1, target));
    if (clamped === page) return;
    onPageChange(clamped);
  }

  return (
    <nav className="mt-2 flex items-center justify-center gap-1.5" aria-label="Directory pagination">
      <PaginationButton
        ariaLabel="Previous page"
        disabled={!canPrev}
        onClick={() => go(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Prev</span>
      </PaginationButton>

      {pages.map((entry, index) => {
        if (entry === "...") {
          return (
            <span
              key={`ellipsis-${index}`}
              className="flex h-9 w-9 items-center justify-center text-muted-foreground"
              aria-hidden
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          );
        }

        const isCurrent = entry === page;
        return (
          <button
            key={entry}
            type="button"
            disabled={disabled}
            onClick={() => go(entry)}
            aria-current={isCurrent ? "page" : undefined}
            className={cn(
              "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2.5 text-sm font-medium tabular-nums transition",
              isCurrent
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border/70 bg-background text-foreground hover:border-primary/50 hover:bg-primary/5",
              disabled && "opacity-60"
            )}
          >
            {entry}
          </button>
        );
      })}

      <PaginationButton
        ariaLabel="Next page"
        disabled={!canNext}
        onClick={() => go(page + 1)}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </PaginationButton>
    </nav>
  );
}

function PaginationButton({
  children,
  onClick,
  disabled,
  ariaLabel
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex h-9 items-center gap-1 rounded-md border border-border/70 bg-background px-2.5 text-sm font-medium transition sm:px-3",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:border-primary/50 hover:bg-primary/5"
      )}
    >
      {children}
    </button>
  );
}
