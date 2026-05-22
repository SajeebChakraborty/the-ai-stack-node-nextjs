"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  ShoppingBag,
  Workflow
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Purchase = {
  id: string;
  status: string;
  amountCents: number;
  basePriceCents: number;
  buyerFeeCents: number;
  currency: string;
  setupConfirmedAt: string | null;
  autoReleaseAt: string | null;
  releasedAt: string | null;
  complaintAt: string | null;
  complaintReason: string | null;
  createdAt: string;
  automation: {
    id: string;
    slug: string;
    title: string;
    thumbnailUrl: string | null;
    zipFileUrl: string | null;
  } | null;
};

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function statusBadge(status: string) {
  switch (status) {
    case "paid_holding":
      return <Badge variant="secondary">Awaiting setup</Badge>;
    case "setup_confirmed":
      return <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/20">In hold window</Badge>;
    case "released":
      return <Badge variant="verified">Completed</Badge>;
    case "complained":
      return <Badge variant="destructive">Complaint open</Badge>;
    case "refunded":
      return <Badge variant="outline">Refunded</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function MyPurchasedAutomationsPanel() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [complaintFor, setComplaintFor] = useState<string | null>(null);
  const [complaintReason, setComplaintReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/automation-purchases?role=buyer");
      const data = (await response.json()) as { purchases?: Purchase[] };
      setPurchases(data.purchases ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitComplaint(purchaseId: string) {
    if (complaintReason.trim().length < 10) {
      toast.error("Please describe the issue (at least 10 characters).");
      return;
    }
    setPendingId(purchaseId);
    try {
      const response = await fetch(`/api/user/automation-purchases/${purchaseId}/complain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: complaintReason.trim() })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? "Could not file complaint.");
      } else {
        toast.success("Complaint filed. Our team will review and follow up.");
        setComplaintFor(null);
        setComplaintReason("");
        await load();
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Your purchases</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Automations you&apos;ve purchased</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Once the seller has set up the automation on your machine, you have a hold window to raise a complaint before funds are released.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      ) : purchases.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            <ShoppingBag className="mb-2 h-5 w-5" />
            You haven&apos;t purchased any automations yet.{" "}
            <Link href="/automations" className="text-primary hover:underline">Browse the marketplace</Link>.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {purchases.map((purchase) => (
            <Card key={purchase.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    {purchase.automation ? (
                      <Link href={`/automations/${purchase.automation.slug}`} className="hover:text-primary">
                        {purchase.automation.title}
                      </Link>
                    ) : (
                      "Automation"
                    )}
                  </CardTitle>
                  {statusBadge(purchase.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <div>
                    <span className="font-medium text-foreground">Purchased:</span> {formatDate(purchase.createdAt)}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Total paid:</span>{" "}
                    {formatMoney(purchase.amountCents, purchase.currency)}
                  </div>
                  {purchase.setupConfirmedAt ? (
                    <div>
                      <span className="font-medium text-foreground">Setup confirmed:</span>{" "}
                      {formatDate(purchase.setupConfirmedAt)}
                    </div>
                  ) : null}
                  {purchase.autoReleaseAt && purchase.status === "setup_confirmed" ? (
                    <div className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Auto-release {formatDate(purchase.autoReleaseAt)}
                    </div>
                  ) : null}
                  {purchase.releasedAt ? (
                    <div className="inline-flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Released {formatDate(purchase.releasedAt)}
                    </div>
                  ) : null}
                </div>

                {purchase.automation?.zipFileUrl ? (
                  <Button asChild variant="outline" size="sm">
                    <a href={purchase.automation.zipFileUrl} target="_blank" rel="noreferrer">
                      <Download className="mr-2 h-4 w-4" /> Download workflow (.zip)
                    </a>
                  </Button>
                ) : null}

                {purchase.status === "paid_holding" ? (
                  <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200">
                    <Workflow className="mr-2 inline h-3.5 w-3.5" />
                    Waiting for the seller to confirm setup. Your funds are safely held in escrow.
                  </p>
                ) : null}

                {purchase.status === "setup_confirmed" ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Setup complete. Once the hold window passes, the seller will be paid. If something is wrong, file a complaint below to pause the release.
                    </p>
                    {complaintFor === purchase.id ? (
                      <div className="space-y-2 rounded-md border bg-secondary/40 p-3">
                        <Textarea
                          rows={3}
                          placeholder="What's not working? Include as much detail as possible."
                          value={complaintReason}
                          onChange={(event) => setComplaintReason(event.target.value)}
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => void submitComplaint(purchase.id)}
                            disabled={pendingId === purchase.id}
                          >
                            {pendingId === purchase.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Submit complaint
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setComplaintFor(null);
                              setComplaintReason("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setComplaintFor(purchase.id);
                          setComplaintReason("");
                        }}
                      >
                        <AlertTriangle className="mr-2 h-4 w-4" /> Something&apos;s wrong — file a complaint
                      </Button>
                    )}
                  </div>
                ) : null}

                {purchase.complaintReason ? (
                  <p className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                    <span className="font-medium">Your complaint:</span> {purchase.complaintReason}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
