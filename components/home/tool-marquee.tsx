"use client";

import { Star } from "lucide-react";

/**
 * Infinite, GPU-friendly marquee of tool / category names.
 * Duplicates the list once and translates -50% so the loop is seamless.
 */
export function ToolMarquee({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  const loop = [...items, ...items];

  return (
    <div className="relative flex overflow-hidden border-y border-white/10 bg-white/[0.02] py-4">
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#05050b] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#05050b] to-transparent" />

      <div className="flex shrink-0 animate-marquee items-center gap-10 pr-10 motion-reduce:animate-none">
        {loop.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-white/55"
          >
            <Star className="h-3.5 w-3.5 fill-primary/70 text-primary" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
