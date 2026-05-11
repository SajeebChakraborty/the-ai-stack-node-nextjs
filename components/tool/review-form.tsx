"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ReviewForm({ toolName }: { toolName: string }) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  function submitReview() {
    if (body.trim().length < 40) {
      setStatus("Add at least 40 characters so the review has enough buyer context.");
      return;
    }
    localStorage.setItem(
      `theaistack_review_${toolName}`,
      JSON.stringify({
        rating,
        body,
        submittedAt: new Date().toISOString()
      })
    );
    setStatus("Review submitted for moderation and AI trust scoring.");
    setBody("");
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 text-amber-500">
        {Array.from({ length: 5 }).map((_, index) => (
          <button key={index} type="button" aria-label={`${index + 1} stars`} onClick={() => setRating(index + 1)}>
            <Star className={index < rating ? "h-5 w-5 fill-current" : "h-5 w-5"} />
          </button>
        ))}
      </div>
      <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Share your implementation context, results, caveats, and proof." />
      <Button className="w-full" onClick={submitReview}>Submit verified review</Button>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}
