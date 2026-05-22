"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Edit, Loader2, ShieldAlert, Workflow, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type OwnedAutomation = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  status: string;
  priceCents: number;
  currency: string;
  thumbnailUrl: string | null;
  purchaseCount: number;
  createdAt: string;
  updatedAt: string;
};

type Purchase = {
  id: string;
  status: string;
  amountCents: number;
  sellerEarningCents: number;
  currency: string;
  setupConfirmedAt: string | null;
  autoReleaseAt: string | null;
  releasedAt: string | null;
  complaintAt: string | null;
  complaintReason: string | null;
  createdAt: string;
  automation: { id: string; slug: string; title: string; thumbnailUrl: string | null } | null;
  buyer: { id: string; name: string; email: string } | null;
};

function formatMoney(cents: number, currency: string) {
  const value = cents / 100;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
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
      return <Badge variant="destructive">Complaint filed</Badge>;
    case "refunded":
      return <Badge variant="outline">Refunded</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function MyCreatedAutomationsPanel() {
  const [automations, setAutomations] = useState<OwnedAutomation[]>([]);
  const [sales, setSales] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [autos, salesResponse] = await Promise.all([
        fetch("/api/user/automations").then((r) => r.json()),
        fetch("/api/user/automation-purchases?role=seller").then((r) => r.json())
      ]);
      setAutomations((autos.automations ?? []) as OwnedAutomation[]);
      setSales((salesResponse.purchases ?? []) as Purchase[]);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmSetup(purchaseId: string) {
    setPendingId(purchaseId);
    try {
      const response = await fetch(`/api/user/automation-purchases/${purchaseId}/confirm-setup`, {
        method: "POST"
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? "Could not confirm setup.");
      } else {
        toast.success("Setup confirmed. Funds will release after the hold window.");
        await load();
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setPendingId(null);
    }
  }

  async function deleteAutomation(id: string) {
    if (!window.confirm("Remove this automation? Sold automations will be archived (not deleted).")) return;
    setPendingId(id);
    try {
      const response = await fetch(`/api/user/automations/${id}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string; archived?: boolean };
      if (!response.ok) {
        toast.error(data.error ?? "Could not delete automation.");
      } else {
        toast.success(data.archived ? "Automation archived." : "Automation deleted.");
        await load();
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Your automations</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Manage published automations</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Confirm setup on buyer machines so the escrow timer can start. Funds release automatically when the hold window expires.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Published automations</h2>
            {automations.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  You haven&apos;t published any automations yet. Use the &quot;Create automation&quot; tab to get started.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {automations.map((automation) => (
                  <Card key={automation.id}>
                    <CardContent className="space-y-3 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold">{automation.title}</h3>
                          <p className="line-clamp-2 text-sm text-muted-foreground">{automation.shortDescription}</p>
                        </div>
                        <Badge variant={automation.status === "published" ? "premium" : "secondary"}>
                          {automation.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Zap className="h-3.5 w-3.5" />
                          {formatMoney(automation.priceCents, automation.currency)}
                        </span>
                        <span>{automation.purchaseCount} sales</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/automations/${automation.slug}`}>View</Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={pendingId === automation.id}
                          onClick={() => deleteAutomation(automation.id)}
                        >
                          {pendingId === automation.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4" />}
                          <span className="ml-1.5">Remove</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Recent sales</h2>
            {sales.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">No sales yet.</CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {sales.map((sale) => (
                  <Card key={sale.id}>
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle className="text-base">
                          {sale.automation?.title ?? "Automation"}
                        </CardTitle>
                        {statusBadge(sale.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                        <div>
                          <span className="font-medium text-foreground">Buyer:</span> {sale.buyer?.name ?? "—"}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Sold:</span> {formatDate(sale.createdAt)}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">You earn:</span>{" "}
                          {formatMoney(sale.sellerEarningCents, sale.currency)}
                        </div>
                        {sale.autoReleaseAt && sale.status === "setup_confirmed" ? (
                          <div className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> Auto-release at {formatDate(sale.autoReleaseAt)}
                          </div>
                        ) : null}
                        {sale.releasedAt ? (
                          <div className="inline-flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Released {formatDate(sale.releasedAt)}
                          </div>
                        ) : null}
                        {sale.complaintAt ? (
                          <div className="inline-flex items-center gap-1 text-red-500">
                            <ShieldAlert className="h-3.5 w-3.5" /> Complaint at {formatDate(sale.complaintAt)}
                          </div>
                        ) : null}
                      </div>

                      {sale.complaintReason ? (
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                          <span className="font-medium">Buyer note:</span> {sale.complaintReason}
                        </div>
                      ) : null}

                      {sale.status === "paid_holding" ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => void confirmSetup(sale.id)}
                            disabled={pendingId === sale.id}
                          >
                            {pendingId === sale.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Workflow className="mr-2 h-4 w-4" />
                            )}
                            I&apos;ve set up the automation
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            Confirm once everything is installed and working on the buyer&apos;s machine.
                          </span>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
