"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicStripeSettings } from "@/types/stripe";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function StripeSettingsForm({ initial }: { initial: PublicStripeSettings }) {
  const router = useRouter();
  const [publishableKey, setPublishableKey] = useState(initial.publishableKey);
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [defaultTaxRateId, setDefaultTaxRateId] = useState(initial.defaultTaxRateId);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [configured, setConfigured] = useState(initial.configured);
  const [secretMasked, setSecretMasked] = useState(initial.secretKeyMasked);
  const [webhookMasked, setWebhookMasked] = useState(initial.webhookSecretMasked);

  async function saveSettings() {
    setSaving(true);
    setStatus(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/stripe-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publishableKey,
          secretKey: secretKey || undefined,
          webhookSecret: webhookSecret || undefined,
          defaultTaxRateId
        })
      });

      const data = (await response.json().catch(() => ({}))) as {
        settings?: PublicStripeSettings;
        error?: string | { formErrors?: string[] };
      };

      if (!response.ok || !data.settings) {
        const message =
          typeof data.error === "string"
            ? data.error
            : "Could not save Stripe settings. Check the database connection.";
        setError(message);
        return;
      }

      setConfigured(data.settings.configured);
      setSecretMasked(data.settings.secretKeyMasked);
      setWebhookMasked(data.settings.webhookSecretMasked);
      setSecretKey("");
      setWebhookSecret("");
      setStatus("Stripe settings saved. Checkout will use these keys on the next request.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Stripe billing</CardTitle>
            <CardDescription>
              Publishable and secret keys power checkout and the billing portal. Webhook secret verifies Stripe events.
            </CardDescription>
          </div>
          <Badge variant={configured ? "verified" : "secondary"}>{configured ? "Live keys configured" : "Not configured"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="stripe-publishable-key">
            Publishable key
          </label>
          <Input
            id="stripe-publishable-key"
            value={publishableKey}
            onChange={(event) => setPublishableKey(event.target.value)}
            placeholder="pk_test_..."
            autoComplete="off"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="stripe-secret-key">
            Secret key
          </label>
          <Input
            id="stripe-secret-key"
            type="password"
            value={secretKey}
            onChange={(event) => setSecretKey(event.target.value)}
            placeholder={secretMasked ? `Saved: ${secretMasked}` : "sk_test_..."}
            autoComplete="new-password"
          />
          <p className="text-xs text-muted-foreground">Leave blank to keep the current secret key.</p>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="stripe-webhook-secret">
            Webhook signing secret
          </label>
          <Input
            id="stripe-webhook-secret"
            type="password"
            value={webhookSecret}
            onChange={(event) => setWebhookSecret(event.target.value)}
            placeholder={webhookMasked ? `Saved: ${webhookMasked}` : "whsec_..."}
            autoComplete="new-password"
          />
          <p className="text-xs text-muted-foreground">
            Point Stripe webhooks to <span className="font-mono">/api/stripe/webhook</span>. Leave blank to keep the current value.
          </p>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="stripe-tax-rate">
            Default tax rate ID (optional)
          </label>
          <Input
            id="stripe-tax-rate"
            value={defaultTaxRateId}
            onChange={(event) => setDefaultTaxRateId(event.target.value)}
            placeholder="txr_..."
            autoComplete="off"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
        <AdminActionButton className="w-fit" doneLabel="Saved" disabled={saving} onClick={saveSettings}>
          {saving ? "Saving..." : "Save Stripe settings"}
        </AdminActionButton>
      </CardContent>
    </Card>
  );
}
