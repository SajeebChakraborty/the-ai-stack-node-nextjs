"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ClaimFeedbackDialog({
  open,
  onClose,
  title,
  messages,
  variant = "validation"
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  messages: string[];
  variant?: "validation" | "upgrade" | "success";
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-feedback-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="claim-feedback-title" className="text-lg font-semibold">
          {title}
        </h2>
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm text-muted-foreground">
          {messages.map((message) => (
            <li key={message} className="list-disc pl-5">
              {message}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {variant === "upgrade" ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button asChild>
                <Link href="/pricing">Upgrade plan</Link>
              </Button>
            </>
          ) : (
            <Button onClick={onClose}>{variant === "success" ? "Close" : "OK"}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
