"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ReviewForm({
  blockedReason,
  toolSlug
}: {
  blockedReason?: string;
  toolSlug: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function showBlockedMessage() {
    if (blockedReason) {
      setStatus(blockedReason);
    }
  }

  function selectRating(value: number) {
    if (blockedReason) {
      showBlockedMessage();
      return;
    }

    setRating(value);
    setStatus(null);
  }

  async function submitReview() {
    if (blockedReason) {
      showBlockedMessage();
      return;
    }

    if (title.trim().length < 4) {
      setStatus("Add a short review title (at least 4 characters).");
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
      {blockedReason ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">{blockedReason}</p>
      ) : null}
      <div className="flex gap-1 text-amber-500">
        {Array.from({ length: 5 }).map((_, index) => (
          <button key={index} type="button" aria-label={`${index + 1} stars`} onClick={() => selectRating(index + 1)}>
            <Star className={index < rating ? "h-5 w-5 fill-current" : "h-5 w-5"} />
          </button>
        ))}
      </div>
      <Input onChange={(event) => setTitle(event.target.value)} placeholder="Summarize your review" value={title} />
      <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Share your implementation context, results, caveats, and proof." />
      <Button className="w-full" disabled={isSubmitting} onClick={submitReview}>
        {isSubmitting ? "Submitting..." : "Submit verified review"}
      </Button>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}

