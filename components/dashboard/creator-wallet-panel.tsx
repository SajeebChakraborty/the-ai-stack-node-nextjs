"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Sparkles,
  Wallet
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ConnectStatus = {
  hasAccount: boolean;
  accountId: string | null;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  ready: boolean;
  requirementsDue: string[];
};

type WalletSummary = {
  connect: ConnectStatus;
  balance: {
    availableCents: number;
    pendingCents: number;
    currency: string;
  } | null;
  lifetimeEarningsCents: number;
  totalSales: number;
  minWithdrawalCents: number;
  currency: string;
  recentPurchases: Array<{
    id: string;
    courseTitle: string;
    amountCents: number;
    creatorEarningCents: number;
    platformFeeCents: number;
    currency: string;
    createdAt: string;
  }>;
};

function formatCurrency(cents: number, currency = "usd") {
  const amount = (cents / 100).toFixed(2);
  if (currency.toLowerCase() === "usd") return `$${amount}`;
  return `${amount} ${currency.toUpperCase()}`;
}

export function CreatorWalletPanel() {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState<null | "connect" | "login" | "payout">(null);
  const [payoutAmountUsd, setPayoutAmountUsd] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ tone: "ok" | "err"; message: string } | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const response = await fetch("/api/user/wallet", { cache: "no-store" });
      if (!response.ok) {
        setSummary(null);
        return;
      }
      const data = (await response.json()) as WalletSummary;
      setSummary(data);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.has("connect")) {
        setStatusMessage({
          tone: "ok",
          message:
            params.get("connect") === "return"
              ? "Welcome back. Stripe is verifying your details — refresh in a minute if status is still incomplete."
              : "Onboarding refreshed. Continue when you're ready."
        });
      }
    }
  }, []);

  async function startOnboarding() {
    setActionBusy("connect");
    setStatusMessage(null);
    try {
      const response = await fetch("/api/user/stripe-connect/onboarding", { method: "POST" });
      const data = (await response.json()) as { url?: string; error?: string };
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        setStatusMessage({ tone: "err", message: data.error ?? "Could not start onboarding." });
      }
    } catch {
      setStatusMessage({ tone: "err", message: "Network error." });
    } finally {
      setActionBusy(null);
    }
  }

  async function openStripeDashboard() {
    setActionBusy("login");
    setStatusMessage(null);
    try {
      const response = await fetch("/api/user/stripe-connect/login", { method: "POST" });
      const data = (await response.json()) as { url?: string; error?: string };
      if (response.ok && data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else {
        setStatusMessage({ tone: "err", message: data.error ?? "Could not open Stripe dashboard." });
      }
    } catch {
      setStatusMessage({ tone: "err", message: "Network error." });
    } finally {
      setActionBusy(null);
    }
  }

  async function requestPayout() {
    if (!summary) return;
    const amount = Math.round(Number(payoutAmountUsd) * 100);
    if (!Number.isFinite(amount) || amount <= 0) {
      setStatusMessage({ tone: "err", message: "Enter a valid amount." });
      return;
    }
    if (amount < summary.minWithdrawalCents) {
      setStatusMessage({
        tone: "err",
        message: `Minimum withdrawal is ${formatCurrency(summary.minWithdrawalCents, summary.currency)}.`
      });
      return;
    }

    setActionBusy("payout");
    setStatusMessage(null);
    try {
      const response = await fetch("/api/user/wallet/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents: amount })
      });
      const data = (await response.json()) as { ok?: boolean; payoutId?: string; error?: string };
      if (response.ok && data.ok) {
        setStatusMessage({
          tone: "ok",
          message: `Payout initiated. Funds will land in your linked bank account.`
        });
        setPayoutAmountUsd("");
        await refresh();
      } else {
        setStatusMessage({ tone: "err", message: data.error ?? "Payout failed." });
      }
    } catch {
      setStatusMessage({ tone: "err", message: "Network error." });
    } finally {
      setActionBusy(null);
    }
  }

  if (loading && !summary) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading your wallet...
      </div>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Could not load your wallet. Please refresh.
        </CardContent>
      </Card>
    );
  }

  const ready = summary.connect.ready;
  const balanceAvailable = summary.balance?.availableCents ?? 0;
  const currency = summary.balance?.currency ?? summary.currency;

  return (
    <div className="space-y-6">
      <header className="space-y-2 border-b border-border/60 pb-5">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Creator wallet</p>
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Earnings & payouts</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          When a buyer pays for your course, your share lands on your Stripe Connect account automatically. Request a
          payout below to send it to your bank.
        </p>
      </header>

      {statusMessage ? (
        <p
          className={`rounded-md border p-3 text-sm ${
            statusMessage.tone === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {statusMessage.message}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Stripe Connect status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!summary.connect.hasAccount ? (
            <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium">Not connected</p>
                <p className="text-sm text-muted-foreground">
                  Connect a Stripe account to receive course sale earnings.
                </p>
              </div>
              <Button onClick={startOnboarding} disabled={actionBusy === "connect"}>
                {actionBusy === "connect" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...
                  </>
                ) : (
                  <>
                    Connect Stripe <ArrowUpRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          ) : ready ? (
            <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium">Connected & ready</p>
                  <p className="text-xs text-muted-foreground">Account ID: {summary.connect.accountId}</p>
                </div>
              </div>
              <Button variant="outline" onClick={openStripeDashboard} disabled={actionBusy === "login"}>
                {actionBusy === "login" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening...
                  </>
                ) : (
                  <>
                    Stripe dashboard <ExternalLink className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <p className="text-sm font-medium">Onboarding incomplete</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant={summary.connect.detailsSubmitted ? "verified" : "outline"}>
                  Details submitted: {summary.connect.detailsSubmitted ? "yes" : "no"}
                </Badge>
                <Badge variant={summary.connect.chargesEnabled ? "verified" : "outline"}>
                  Can receive funds: {summary.connect.chargesEnabled ? "yes" : "no"}
                </Badge>
                <Badge variant={summary.connect.payoutsEnabled ? "verified" : "outline"}>
                  Payouts: {summary.connect.payoutsEnabled ? "yes" : "no"}
                </Badge>
              </div>
              {summary.connect.requirementsDue.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Stripe still needs: {summary.connect.requirementsDue.join(", ")}
                </p>
              ) : null}
              <Button onClick={startOnboarding} disabled={actionBusy === "connect"}>
                {actionBusy === "connect" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening...
                  </>
                ) : (
                  "Continue Stripe onboarding"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Available balance"
          value={formatCurrency(balanceAvailable, currency)}
          hint="Ready to withdraw"
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          label="Pending"
          value={formatCurrency(summary.balance?.pendingCents ?? 0, currency)}
          hint="Stripe is still settling"
        />
        <StatCard
          label="Lifetime earnings"
          value={formatCurrency(summary.lifetimeEarningsCents, summary.currency)}
          hint={`${summary.totalSales} sale${summary.totalSales === 1 ? "" : "s"}`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Withdraw to your bank</CardTitle>
          <p className="text-sm text-muted-foreground">
            Minimum withdrawal: {formatCurrency(summary.minWithdrawalCents, summary.currency)}. Payouts are processed by
            Stripe directly to your linked bank.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              type="number"
              placeholder="Amount (USD)"
              min="0"
              step="0.01"
              value={payoutAmountUsd}
              onChange={(event) => setPayoutAmountUsd(event.target.value)}
              disabled={!ready || actionBusy === "payout"}
              className="md:max-w-[200px]"
            />
            <Button onClick={requestPayout} disabled={!ready || actionBusy === "payout"}>
              {actionBusy === "payout" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                </>
              ) : (
                "Withdraw"
              )}
            </Button>
            {!ready ? (
              <span className="text-xs text-muted-foreground">Finish Stripe onboarding to enable withdrawals.</span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent sales</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.recentPurchases.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales yet. When buyers purchase your course, transactions show up here.</p>
          ) : (
            <ul className="divide-y">
              {summary.recentPurchases.map((purchase) => (
                <li key={purchase.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium">{purchase.courseTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(purchase.createdAt).toLocaleString()} · Buyer paid {formatCurrency(purchase.amountCents, purchase.currency)} · Fee {formatCurrency(purchase.platformFeeCents, purchase.currency)}
                    </p>
                  </div>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(purchase.creatorEarningCents, purchase.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="space-y-1 p-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          {icon}
          {label}
        </div>
        <div className="text-3xl font-semibold">{value}</div>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
