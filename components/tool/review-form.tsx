"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ReviewForm({
  canReview,
  helperText,
  toolSlug
}: {
  canReview: boolean;
  helperText?: string;
  toolSlug: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitReview() {
    if (!canReview) {
      setStatus(helperText ?? "Only signed-in community members can review this listing.");
      return;
    }

    if (title.trim().length < 4) {
      setStatus("Add a short review title.");
      return;
    }

    if (body.trim().length < 40) {
      setStatus("Add at least 40 characters so the review has enough buyer context.");
      return;
    }

    setIsSubmitting(true);
    setStatus("Submitting review...");

    try {
      const response = await fetch(`/api/tools/${toolSlug}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          body,
          rating
        })
      });

      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setStatus(payload.error ?? "Review submission failed.");
        return;
      }

      setStatus(payload.message ?? "Review submitted.");
      setTitle("");
      setBody("");
      router.refresh();
    } catch {
      setStatus("Review submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 text-amber-500">
        {Array.from({ length: 5 }).map((_, index) => (
          <button key={index} type="button" aria-label={`${index + 1} stars`} disabled={!canReview} onClick={() => setRating(index + 1)}>
            <Star className={index < rating ? "h-5 w-5 fill-current" : "h-5 w-5"} />
          </button>
        ))}
      </div>
      <Input disabled={!canReview} onChange={(event) => setTitle(event.target.value)} placeholder="Summarize your review" value={title} />
      <Textarea disabled={!canReview} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Share your implementation context, results, caveats, and proof." />
      <Button className="w-full" disabled={isSubmitting || !canReview} onClick={submitReview}>
        {isSubmitting ? "Submitting..." : "Submit verified review"}
      </Button>
      {helperText ? <p className="text-xs text-muted-foreground">{helperText}</p> : null}
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}
