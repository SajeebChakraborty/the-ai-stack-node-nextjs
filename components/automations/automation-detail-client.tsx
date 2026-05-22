"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  Info,
  Loader2,
  ShieldCheck,
  User,
  Workflow
} from "lucide-react";
import type { AutomationDetail } from "@/lib/queries/automations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RemoteImage } from "@/components/ui/remote-image";
import { toast } from "sonner";

export function AutomationDetailClient({
  automation,
  currentUserId
}: {
  automation: AutomationDetail;
  currentUserId: string | null;
}) {
  const [buying, setBuying] = useState(false);
  const priceUsd = automation.priceCents / 100;
  const isOwner = currentUserId === automation.ownerId;
  const canDownload = automation.hasPurchased && Boolean(automation.zipFileUrl);

  async function handleBuy() {
    if (!currentUserId) {
      toast.error("Sign in to buy this automation.");
      window.location.href = `/sign-in?next=/automations/${automation.slug}`;
      return;
    }

    setBuying(true);
    try {
      const response = await fetch("/api/automations/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ automationId: automation.id })
      });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        toast.error(data.error ?? "Could not start checkout.");
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error("Network error while starting checkout.");
    } finally {
      setBuying(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.65fr_1fr]">
      <div className="space-y-6">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link href="/automations" className="hover:text-primary">Automations</Link>
            <span>/</span>
            <span className="text-foreground">{automation.title}</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight md:text-4xl">{automation.title}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{automation.shortDescription}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User className="h-4 w-4" /> {automation.ownerName}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" /> ~{automation.setupMinutes} min setup
            </span>
            {automation.featured ? <Badge variant="premium">Featured</Badge> : null}
          </div>
        </div>

        {automation.thumbnailUrl ? (
          <div className="aspect-video overflow-hidden rounded-2xl border">
            <RemoteImage
              src={automation.thumbnailUrl}
              alt={automation.title}
              width={1280}
              height={720}
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        {automation.highlights.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>What this automation does</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {automation.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{automation.description}</p>
          </CardContent>
        </Card>

        {automation.toolingTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {automation.toolingTags.map((tag) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        ) : null}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="text-3xl font-bold">
              {automation.priceCents > 0 ? `$${priceUsd.toFixed(2)}` : "Free"}
              {automation.priceCents > 0 ? (
                <span className="ml-2 text-sm font-normal text-muted-foreground">USD</span>
              ) : null}
            </div>

            {isOwner ? (
              <>
                <Badge variant="outline">You own this automation</Badge>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/dashboard?view=my-created-automations">
                    Manage in dashboard <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </>
            ) : automation.hasPurchased ? (
              <>
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
                  You&apos;ve already purchased this automation. Check your dashboard to confirm setup and download the workflow.
                </div>
                {canDownload ? (
                  <Button asChild variant="outline" className="w-full">
                    <a href={automation.zipFileUrl ?? "#"} target="_blank" rel="noreferrer">
                      <Download className="mr-2 h-4 w-4" /> Download workflow (.zip)
                    </a>
                  </Button>
                ) : null}
                <Button asChild className="w-full">
                  <Link href="/dashboard?view=my-purchased-automations">Open purchase</Link>
                </Button>
              </>
            ) : automation.priceCents > 0 ? (
              <Button className="w-full" onClick={handleBuy} disabled={buying}>
                {buying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting checkout...
                  </>
                ) : (
                  `Buy for $${priceUsd.toFixed(2)}`
                )}
              </Button>
            ) : (
              <Button asChild className="w-full">
                <Link href="/sign-in">Get this automation</Link>
              </Button>
            )}

            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Payment held in escrow until you confirm
              </p>
              <p className="inline-flex items-center gap-1">
                <Workflow className="h-3.5 w-3.5 text-primary" /> Workflow file included
              </p>
              <p className="inline-flex items-center gap-1">
                <Info className="h-3.5 w-3.5 text-amber-500" /> 24h to raise a complaint after setup
              </p>
            </div>
          </CardContent>
        </Card>

        {automation.setupInstructions ? (
          <Card>
            <CardHeader>
              <CardTitle>How setup works</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {automation.setupInstructions}
              </p>
            </CardContent>
          </Card>
        ) : null}
      </aside>
    </div>
  );
}
