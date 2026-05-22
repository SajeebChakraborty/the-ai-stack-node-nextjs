"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Undo2,
  Wallet
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type AdminPurchase = {
  id: string;
  status: string;
  amountCents: number;
  basePriceCents: number;
  buyerFeeCents: number;
  sellerFeeCents: number;
  sellerEarningCents: number;
  platformTotalCents: number;
  currency: string;
  setupConfirmedAt: string | null;
  autoReleaseAt: string | null;
  releasedAt: string | null;
  complaintAt: string | null;
  complaintReason: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  automation: { id: string; slug: string; title: string } | null;
  buyer: { id: string; name: string; email: string } | null;
  seller: { id: string; name: string; email: string; stripeAccountId: string | null } | null;
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
      return <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/20">In hold</Badge>;
    case "released":
      return <Badge variant="verified">Released</Badge>;
    case "complained":
      return <Badge variant="destructive">Complaint</Badge>;
    case "refunded":
      return <Badge variant="outline">Refunded</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "paid_holding", label: "Awaiting seller setup" },
  { value: "setup_confirmed", label: "In hold window" },
  { value: "complained", label: "Complaints" },
  { value: "released", label: "Released" },
  { value: "refunded", label: "Refunded" }
];

export function AdminAutomationPurchasesPanel() {
  const [purchases, setPurchases] = useState<AdminPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [refundNotesFor, setRefundNotesFor] = useState<string | null>(null);
  const [refundNotes, setRefundNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: filter });
      const response = await fetch(`/api/admin/automation-purchases?${params.toString()}`);
      const data = (await response.json()) as { purchases?: AdminPurchase[]; error?: string };
      if (response.ok) {
        setPurchases(data.purchases ?? []);
      } else {
        toast.error(data.error ?? "Could not load purchases.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function releaseFunds(purchaseId: string) {
    if (!window.confirm("Release escrowed funds to the seller now?")) return;
    setPendingId(purchaseId);
    try {
      const response = await fetch(`/api/admin/automation-purchases/${purchaseId}/release`, { method: "POST" });
      const data = (await response.json()) as { error?: string; transferId?: string | null };
      if (!response.ok) {
        toast.error(data.error ?? "Could not release funds.");
      } else {
        toast.success("Funds released to seller.");
        await load();
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setPendingId(null);
    }
  }

  async function refundBuyer(purchaseId: string) {
    setPendingId(purchaseId);
    try {
      const response = await fetch(`/api/admin/automation-purchases/${purchaseId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: refundNotes.trim() || undefined })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? "Could not refund buyer.");
      } else {
        toast.success("Buyer refunded.");
        setRefundNotesFor(null);
        setRefundNotes("");
        await load();
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setPendingId(null);
    }
  }

  async function runAutoReleaseSweep() {
    setRunning(true);
    try {
      const response = await fetch("/api/cron/automation-auto-release", { method: "POST" });
      const data = (await response.json()) as { releasedCount?: number; error?: string };
      if (!response.ok) {
        toast.error(data.error ?? "Could not run sweep.");
      } else {
        toast.success(`Released ${data.releasedCount ?? 0} purchase(s).`);
        await load();
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Automation purchase escrow</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Review buyer purchases. Release funds to the seller when complete, or refund the buyer when a complaint can&apos;t be resolved.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" disabled={loading} onClick={() => void load()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Button size="sm" disabled={running} onClick={() => void runAutoReleaseSweep()}>
              {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
              Run auto-release sweep
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {purchases.length === 0 ? (
          <div className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
            No purchases match the current filter.
          </div>
        ) : (
          purchases.map((purchase) => (
            <div key={purchase.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{purchase.automation?.title ?? "Automation"}</span>
                    {statusBadge(purchase.status)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Buyer: {purchase.buyer?.email ?? "—"} · Seller: {purchase.seller?.email ?? "—"}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold">{formatMoney(purchase.amountCents, purchase.currency)}</div>
                  <div className="text-xs text-muted-foreground">
                    Seller earns {formatMoney(purchase.sellerEarningCents, purchase.currency)} · Platform{" "}
                    {formatMoney(purchase.platformTotalCents, purchase.currency)}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                <div>Purchased: {formatDate(purchase.createdAt)}</div>
                <div>Setup confirmed: {formatDate(purchase.setupConfirmedAt)}</div>
                <div>Auto-release: {formatDate(purchase.autoReleaseAt)}</div>
                <div>Released: {formatDate(purchase.releasedAt)}</div>
              </div>

              {purchase.complaintReason ? (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                  <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                  <span className="font-medium">Complaint:</span> {purchase.complaintReason}
                </div>
              ) : null}

              {!purchase.seller?.stripeAccountId ? (
                <p className="mt-2 text-xs text-amber-600">
                  Seller has not connected a Stripe payout account — release will fail until they do.
                </p>
              ) : null}

              {purchase.status !== "released" && purchase.status !== "refunded" ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => void releaseFunds(purchase.id)}
                    disabled={pendingId === purchase.id || !purchase.seller?.stripeAccountId}
                  >
                    {pendingId === purchase.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wallet className="mr-2 h-4 w-4" />
                    )}
                    Release to seller
                  </Button>
                  {refundNotesFor === purchase.id ? (
                    <div className="flex w-full flex-col gap-2 rounded-md border bg-secondary/40 p-2">
                      <Textarea
                        rows={2}
                        placeholder="Resolution notes (optional)"
                        value={refundNotes}
                        onChange={(event) => setRefundNotes(event.target.value)}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => void refundBuyer(purchase.id)}
                          disabled={pendingId === purchase.id}
                        >
                          {pendingId === purchase.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Confirm refund
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setRefundNotesFor(null);
                            setRefundNotes("");
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
                        setRefundNotesFor(purchase.id);
                        setRefundNotes("");
                      }}
                    >
                      <Undo2 className="mr-2 h-4 w-4" /> Refund buyer
                    </Button>
                  )}
                </div>
              ) : null}

              {purchase.status === "released" ? (
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Funds released.
                </p>
              ) : null}
              {purchase.status === "refunded" ? (
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" /> Refunded to buyer.
                </p>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
