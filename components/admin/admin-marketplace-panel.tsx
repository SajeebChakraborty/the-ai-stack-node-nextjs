"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Percent, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Settings = {
  platformFeePercent: number;
  minWithdrawalCents: number;
  currency: string;
  automationSellerFeePercent: number;
  automationBuyerFeePercent: number;
  automationAutoReleaseHours: number;
};

const defaultSettings: Settings = {
  platformFeePercent: 10,
  minWithdrawalCents: 1000,
  currency: "usd",
  automationSellerFeePercent: 10,
  automationBuyerFeePercent: 10,
  automationAutoReleaseHours: 24
};

export function AdminMarketplacePanel() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [feePercent, setFeePercent] = useState("10");
  const [minWithdrawalUsd, setMinWithdrawalUsd] = useState("10");
  const [automationSellerFee, setAutomationSellerFee] = useState("10");
  const [automationBuyerFee, setAutomationBuyerFee] = useState("10");
  const [autoReleaseHours, setAutoReleaseHours] = useState("24");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/marketplace")
      .then((response) => response.json())
      .then((payload: { settings?: Settings }) => {
        if (cancelled) return;
        const next = { ...defaultSettings, ...(payload.settings ?? {}) };
        setSettings(next);
        setFeePercent(String(next.platformFeePercent));
        setMinWithdrawalUsd((next.minWithdrawalCents / 100).toFixed(2));
        setAutomationSellerFee(String(next.automationSellerFeePercent));
        setAutomationBuyerFee(String(next.automationBuyerFeePercent));
        setAutoReleaseHours(String(next.automationAutoReleaseHours));
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setSaving(true);
    setStatusMessage(null);

    const platformFeePercent = Number(feePercent);
    const minWithdrawalCents = Math.round(Number(minWithdrawalUsd) * 100);
    const automationSellerFeePercent = Number(automationSellerFee);
    const automationBuyerFeePercent = Number(automationBuyerFee);
    const automationAutoReleaseHours = Number(autoReleaseHours);

    const range = (value: number, min: number, max: number) => Number.isFinite(value) && value >= min && value <= max;

    if (!range(platformFeePercent, 0, 50)) {
      setStatusMessage("Course platform fee must be between 0% and 50%.");
      setSaving(false);
      return;
    }
    if (!Number.isFinite(minWithdrawalCents) || minWithdrawalCents < 0) {
      setStatusMessage("Minimum withdrawal must be a positive amount.");
      setSaving(false);
      return;
    }
    if (!range(automationSellerFeePercent, 0, 50)) {
      setStatusMessage("Automation seller fee must be between 0% and 50%.");
      setSaving(false);
      return;
    }
    if (!range(automationBuyerFeePercent, 0, 50)) {
      setStatusMessage("Automation buyer fee must be between 0% and 50%.");
      setSaving(false);
      return;
    }
    if (!range(automationAutoReleaseHours, 0, 720)) {
      setStatusMessage("Auto-release hours must be 0–720.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/marketplace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformFeePercent,
          minWithdrawalCents,
          automationSellerFeePercent,
          automationBuyerFeePercent,
          automationAutoReleaseHours
        })
      });
      const data = (await response.json()) as { settings?: Settings; error?: unknown };
      if (!response.ok || !data.settings) {
        setStatusMessage("Could not save marketplace settings.");
      } else {
        setSettings(data.settings);
        setFeePercent(String(data.settings.platformFeePercent));
        setMinWithdrawalUsd((data.settings.minWithdrawalCents / 100).toFixed(2));
        setAutomationSellerFee(String(data.settings.automationSellerFeePercent));
        setAutomationBuyerFee(String(data.settings.automationBuyerFeePercent));
        setAutoReleaseHours(String(data.settings.automationAutoReleaseHours));
        setStatusMessage("Marketplace settings updated.");
      }
    } catch {
      setStatusMessage("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  const exampleAmount = 100;
  const exampleFee = (exampleAmount * settings.platformFeePercent) / 100;
  const exampleEarning = exampleAmount - exampleFee;
  const automationBuyerPays = exampleAmount + (exampleAmount * settings.automationBuyerFeePercent) / 100;
  const automationSellerEarns = exampleAmount - (exampleAmount * settings.automationSellerFeePercent) / 100;
  const automationPlatformEarns = automationBuyerPays - automationSellerEarns;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Course marketplace</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure the platform fee taken from every paid course sale, and the minimum amount creators can withdraw
            from their Stripe Connect balance.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="platform-fee">
              Platform fee (%)
            </label>
            <div className="relative">
              <Input
                id="platform-fee"
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={feePercent}
                disabled={loading || saving}
                onChange={(event) => setFeePercent(event.target.value)}
              />
              <Percent className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Deducted from each paid course sale.</p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="min-withdrawal">
              Minimum withdrawal (USD)
            </label>
            <Input
              id="min-withdrawal"
              type="number"
              min="0"
              step="1"
              value={minWithdrawalUsd}
              disabled={loading || saving}
              onChange={(event) => setMinWithdrawalUsd(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">Creators must reach this balance before requesting a payout.</p>
          </div>

          <div className="md:col-span-2 grid gap-3 rounded-md border bg-muted/40 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Example</Badge>
              <span className="text-sm text-muted-foreground">$100 course sale at the current platform fee</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <ExampleStat label="Buyer pays" value={`$${exampleAmount.toFixed(2)}`} />
              <ExampleStat
                label="Platform earns"
                value={`$${exampleFee.toFixed(2)}`}
                hint={`${settings.platformFeePercent}% fee`}
              />
              <ExampleStat label="Creator earns" value={`$${exampleEarning.toFixed(2)}`} icon={<Wallet className="h-4 w-4" />} />
            </div>
          </div>

          {statusMessage ? <p className="md:col-span-2 text-sm text-muted-foreground">{statusMessage}</p> : null}

        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Automation marketplace (escrow)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Automations charge fees from <strong>both sides</strong>. Buyer pays price + buyer fee. After seller confirms
            setup, funds are held for the auto-release window before being released to the seller.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="automation-buyer-fee">
              Buyer fee (%)
            </label>
            <div className="relative">
              <Input
                id="automation-buyer-fee"
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={automationBuyerFee}
                disabled={loading || saving}
                onChange={(event) => setAutomationBuyerFee(event.target.value)}
              />
              <Percent className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Added on top of the seller&apos;s price.</p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="automation-seller-fee">
              Seller fee (%)
            </label>
            <div className="relative">
              <Input
                id="automation-seller-fee"
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={automationSellerFee}
                disabled={loading || saving}
                onChange={(event) => setAutomationSellerFee(event.target.value)}
              />
              <Percent className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Deducted from the seller&apos;s payout.</p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="auto-release-hours">
              Auto-release window (hours)
            </label>
            <Input
              id="auto-release-hours"
              type="number"
              min="0"
              max="720"
              step="1"
              value={autoReleaseHours}
              disabled={loading || saving}
              onChange={(event) => setAutoReleaseHours(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">After seller marks setup complete.</p>
          </div>

          <div className="md:col-span-3 grid gap-3 rounded-md border bg-muted/40 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Example</Badge>
              <span className="text-sm text-muted-foreground">
                $100 automation at the current fees ({settings.automationBuyerFeePercent}% buyer + {" "}
                {settings.automationSellerFeePercent}% seller)
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <ExampleStat label="Buyer pays" value={`$${automationBuyerPays.toFixed(2)}`} />
              <ExampleStat
                label="Platform earns"
                value={`$${automationPlatformEarns.toFixed(2)}`}
                hint={`${settings.automationBuyerFeePercent + settings.automationSellerFeePercent}% combined`}
              />
              <ExampleStat
                label="Seller earns"
                value={`$${automationSellerEarns.toFixed(2)}`}
                icon={<Wallet className="h-4 w-4" />}
              />
            </div>
          </div>

          {statusMessage ? <p className="md:col-span-3 text-sm text-muted-foreground">{statusMessage}</p> : null}

          <div className="md:col-span-3 flex items-center gap-3">
            <Button onClick={save} disabled={loading || saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save marketplace settings
                </>
              )}
            </Button>
            {loading ? (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading current settings...
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ExampleStat({
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
    <div className="rounded-md border bg-background p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
      {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}
