"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function DiscussionForm({
  blockedReason,
  toolSlug
}: {
  blockedReason?: string;
  toolSlug: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function showBlockedMessage() {
    if (blockedReason) {
      setStatus(blockedReason);
    }
  }

  async function submitDiscussion() {
    if (blockedReason) {
      showBlockedMessage();
      return;
    }

    if (title.trim().length < 4) {
      setStatus("Add a discussion title (at least 4 characters).");
      return;
    }

    if (body.trim().length < 20) {
      setStatus("Add at least 20 characters of context for your discussion.");
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
      {blockedReason ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">{blockedReason}</p>
      ) : null}
      <Input onChange={(event) => setTitle(event.target.value)} placeholder="Start a discussion topic" value={title} />
      <Textarea onChange={(event) => setBody(event.target.value)} placeholder="Share your question, implementation notes, or comparison detail." value={body} />
      <Button className="w-full" disabled={isSubmitting} onClick={submitDiscussion}>
        {isSubmitting ? "Posting..." : "Start discussion"}
      </Button>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}
