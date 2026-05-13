"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DiscussionVoteButtons({
  canVote,
  discussionId,
  helperText,
  voteScore
}: {
  canVote: boolean;
  discussionId: string;
  helperText?: string;
  voteScore: number;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitVote(vote: 1 | -1) {
    if (!canVote) {
      setStatus(helperText ?? "Only signed-in community members can vote.");
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch(`/api/discussions/${discussionId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ vote })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus(payload.error ?? "Voting failed.");
        return;
      }

      router.refresh();
    } catch {
      setStatus("Voting failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button disabled={isSubmitting} size="sm" variant="outline" onClick={() => submitVote(1)}>
          <ArrowBigUp className="mr-1 h-4 w-4" />
          Upvote
        </Button>
        <Button disabled={isSubmitting} size="sm" variant="outline" onClick={() => submitVote(-1)}>
          <ArrowBigDown className="mr-1 h-4 w-4" />
          Downvote
        </Button>
        <span className="text-sm text-muted-foreground">{voteScore} votes</span>
      </div>
      {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
    </div>
  );
}
