"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Fees = {
  automationBuyerFeePercent: number;
  automationSellerFeePercent: number;
  automationAutoReleaseHours: number;
};

type Draft = {
  title: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string;
  promoVideoUrl: string;
  zipFileUrl: string;
  setupInstructions: string;
  setupMinutes: string;
  priceUsd: string;
  toolingTagsText: string;
  highlightsText: string;
};

const emptyDraft: Draft = {
  title: "",
  shortDescription: "",
  description: "",
  thumbnailUrl: "",
  promoVideoUrl: "",
  zipFileUrl: "",
  setupInstructions:
    "1. We hop on a quick call.\n2. Share your screen — I'll install n8n / Make / etc.\n3. We test the workflow end-to-end.\n4. You get the credentials you need.",
  setupMinutes: "30",
  priceUsd: "99",
  toolingTagsText: "n8n\nWebhooks\nAI",
  highlightsText:
    "Automates a manual task in your day-to-day\nIncludes step-by-step setup on a screen-share\nFully editable in n8n / Make"
};

function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function AutomationCreatorPanel({ onCreated }: { onCreated?: () => void }) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ tone: "ok" | "err"; message: string } | null>(null);
  const [fees, setFees] = useState<Fees | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/marketplace/fees")
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: Fees | null) => {
        if (!cancelled && payload) setFees(payload);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const priceCents = Math.max(0, Math.round(Number(draft.priceUsd || 0) * 100));
  const buyerFee = fees ? (priceCents * fees.automationBuyerFeePercent) / 100 : 0;
  const sellerFee = fees ? (priceCents * fees.automationSellerFeePercent) / 100 : 0;
  const buyerPays = priceCents + buyerFee;
  const sellerEarns = Math.max(0, priceCents - sellerFee);

  async function submit() {
    if (!draft.title.trim() || !draft.shortDescription.trim() || !draft.description.trim() || !draft.zipFileUrl.trim()) {
      setStatus({ tone: "err", message: "Title, descriptions, and zip URL are required." });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      const response = await fetch("/api/user/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title.trim(),
          shortDescription: draft.shortDescription.trim(),
          description: draft.description.trim(),
          thumbnailUrl: draft.thumbnailUrl.trim() || undefined,
          promoVideoUrl: draft.promoVideoUrl.trim() || undefined,
          zipFileUrl: draft.zipFileUrl.trim(),
          setupInstructions: draft.setupInstructions.trim() || undefined,
          toolingTags: parseLines(draft.toolingTagsText),
          highlights: parseLines(draft.highlightsText),
          setupMinutes: Math.max(0, Math.round(Number(draft.setupMinutes || 30))),
          priceUsd: Math.max(0, Number(draft.priceUsd || 0))
        })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus({ tone: "err", message: data.error ?? "Could not publish automation." });
      } else {
        setStatus({ tone: "ok", message: "Automation published!" });
        setDraft(emptyDraft);
        onCreated?.();
      }
    } catch {
      setStatus({ tone: "err", message: "Network error." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Automation marketplace</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Publish a new automation</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Sell a workflow + setup service. Buyers pay up front; funds release to you {fees ? `${fees.automationAutoReleaseHours}h` : "24h"} after you confirm setup, unless they raise a complaint.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Automation details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="auto-title">Title</label>
              <Input
                id="auto-title"
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                placeholder="LinkedIn lead → CRM auto-flow"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="auto-short">Short description (1-2 lines)</label>
              <Textarea
                id="auto-short"
                rows={2}
                value={draft.shortDescription}
                onChange={(event) => setDraft({ ...draft, shortDescription: event.target.value })}
                placeholder="What does this automation do, in one sentence?"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="auto-long">Full description</label>
              <Textarea
                id="auto-long"
                rows={6}
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                placeholder="Explain how it works, what the buyer needs (accounts, API keys), and what they'll get."
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="auto-tags">Tooling (one per line)</label>
              <Textarea
                id="auto-tags"
                rows={3}
                value={draft.toolingTagsText}
                onChange={(event) => setDraft({ ...draft, toolingTagsText: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="auto-highlights">Highlights (one per line)</label>
              <Textarea
                id="auto-highlights"
                rows={4}
                value={draft.highlightsText}
                onChange={(event) => setDraft({ ...draft, highlightsText: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="auto-setup">How setup works (shown on the listing)</label>
              <Textarea
                id="auto-setup"
                rows={5}
                value={draft.setupInstructions}
                onChange={(event) => setDraft({ ...draft, setupInstructions: event.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Files &amp; media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="auto-zip">Workflow zip URL</label>
                <Input
                  id="auto-zip"
                  type="url"
                  placeholder="https://drive.google.com/file/.../workflow.zip"
                  value={draft.zipFileUrl}
                  onChange={(event) => setDraft({ ...draft, zipFileUrl: event.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Host the .zip anywhere (Drive, Dropbox, S3). Only revealed to buyers.
                </p>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="auto-thumb">Thumbnail URL</label>
                <Input
                  id="auto-thumb"
                  type="url"
                  value={draft.thumbnailUrl}
                  onChange={(event) => setDraft({ ...draft, thumbnailUrl: event.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="auto-promo">Promo video URL (optional)</label>
                <Input
                  id="auto-promo"
                  type="url"
                  value={draft.promoVideoUrl}
                  onChange={(event) => setDraft({ ...draft, promoVideoUrl: event.target.value })}
                  placeholder="YouTube / Loom link"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="auto-setup-mins">Setup time (minutes)</label>
                <Input
                  id="auto-setup-mins"
                  type="number"
                  min="0"
                  value={draft.setupMinutes}
                  onChange={(event) => setDraft({ ...draft, setupMinutes: event.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing &amp; payout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="auto-price">Your price (USD)</label>
                <Input
                  id="auto-price"
                  type="number"
                  min="0"
                  step="1"
                  value={draft.priceUsd}
                  onChange={(event) => setDraft({ ...draft, priceUsd: event.target.value })}
                />
              </div>
              {fees ? (
                <div className="rounded-md border bg-muted/40 p-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">Buyer pays</span>
                    <Badge variant="outline">${(buyerPays / 100).toFixed(2)}</Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">price + {fees.automationBuyerFeePercent}% buyer fee</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">You earn (after release)</span>
                    <Badge variant="premium">${(sellerEarns / 100).toFixed(2)}</Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">price - {fees.automationSellerFeePercent}% seller fee</p>
                  <div className="mt-3 inline-flex items-center gap-1 text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Funds held for
                    {" "}
                    {fees.automationAutoReleaseHours}h after setup confirmation
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      {status ? (
        <p className={status.tone === "ok" ? "text-sm text-emerald-600" : "text-sm text-red-500"}>{status.message}</p>
      ) : null}

      <Button size="lg" onClick={submit} disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...
          </>
        ) : (
          <>
            <Zap className="mr-2 h-4 w-4" /> Publish automation
          </>
        )}
      </Button>
    </div>
  );
}
