"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function DiscussionForm({
  canPost,
  helperText,
  toolSlug
}: {
  canPost: boolean;
  helperText?: string;
  toolSlug: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitDiscussion() {
    if (!canPost) {
      setStatus(helperText ?? "Only signed-in community members can open discussions.");
      return;
    }

    if (title.trim().length < 4 || body.trim().length < 20) {
      setStatus("Add a discussion title and at least 20 characters of context.");
      return;
    }

    setIsSubmitting(true);
    setStatus("Posting discussion...");

    try {
      const response = await fetch(`/api/tools/${toolSlug}/discussions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          body
        })
      });

      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setStatus(payload.error ?? "Discussion posting failed.");
        return;
      }

      setStatus(payload.message ?? "Discussion posted.");
      setTitle("");
      setBody("");
      router.refresh();
    } catch {
      setStatus("Discussion posting failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <Input disabled={!canPost} onChange={(event) => setTitle(event.target.value)} placeholder="Start a discussion topic" value={title} />
      <Textarea disabled={!canPost} onChange={(event) => setBody(event.target.value)} placeholder="Share your question, implementation notes, or comparison detail." value={body} />
      <Button className="w-full" disabled={!canPost || isSubmitting} onClick={submitDiscussion}>
        {isSubmitting ? "Posting..." : "Start discussion"}
      </Button>
      {helperText ? <p className="text-xs text-muted-foreground">{helperText}</p> : null}
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}
