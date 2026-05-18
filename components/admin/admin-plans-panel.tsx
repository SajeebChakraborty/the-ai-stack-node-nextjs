"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, RefreshCw, Trash2 } from "lucide-react";
import type { PremiumPlan } from "@/types/domain";
import { parseCourseLimitFromLimits } from "@/lib/plans/limits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type PlanForm = {
  id: string;
  name: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  badge: PremiumPlan["badge"] | "";
  claimedListings: string;
  courseEnrollments: string;
  featuresText: string;
  enabled: boolean;
};

const badgeOptions: Array<PremiumPlan["badge"] | ""> = ["", "Popular", "Recommended", "Best Value"];

function parseClaimLimitInput(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "unlimited") {
    return "unlimited" as const;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function toForm(plan?: PremiumPlan): PlanForm {
  return {
    id: plan?.id ?? "",
    name: plan?.name ?? "",
    description: plan?.description ?? "",
    monthlyPrice: plan ? String(plan.monthlyPrice) : "29",
    yearlyPrice: plan ? String(plan.yearlyPrice) : "290",
    badge: plan?.badge ?? "",
    claimedListings:
      plan?.limits.claimedListings === "unlimited" || plan?.limits.claimedListings === "Unlimited"
        ? "unlimited"
        : String(plan?.limits.claimedListings ?? 1),
    courseEnrollments: (() => {
      const limit = plan ? parseCourseLimitFromLimits(plan.limits) : 5;
      if (limit === null) {
        return "unlimited";
      }
      const raw = plan?.limits.courses;
      if (raw === undefined) {
        return String(limit);
      }
      return String(raw);
    })(),
    featuresText: plan?.features.join("\n") ?? "1 claimed listing\nLaunch updates\nBasic analytics",
    enabled: plan?.enabled ?? true
  };
}

function isRealStripePriceId(id: string) {
  if (!id.startsWith("price_")) return false;
  return /^[A-Za-z0-9]{14,}$/.test(id.slice(6));
}

function isRealStripeProductId(id: string) {
  if (!id.startsWith("prod_")) return false;
  return /^[A-Za-z0-9]{14,}$/.test(id.slice(5));
}

function stripeStatus(plan: PremiumPlan) {
  if (plan.monthlyPrice <= 0 && plan.yearlyPrice <= 0) {
    return { label: "Free plan", variant: "secondary" as const };
  }

  const synced =
    isRealStripeProductId(plan.stripeProductId) &&
    (plan.monthlyPrice <= 0 || isRealStripePriceId(plan.stripeMonthlyPriceId)) &&
    (plan.yearlyPrice <= 0 || isRealStripePriceId(plan.stripeYearlyPriceId));

  return synced
    ? { label: "Synced with Stripe", variant: "verified" as const }
    : { label: "Needs Stripe sync", variant: "outline" as const };
}

export function AdminPlansPanel({ initialPlans }: { initialPlans: PremiumPlan[] }) {
  const router = useRouter();
  const [plans, setPlans] = useState(initialPlans);
  const [planQuery, setPlanQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<PlanForm>(() => toForm());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  useEffect(() => {
    setPlans(initialPlans);
  }, [initialPlans]);

  const filteredPlans = useMemo(
    () => plans.filter((plan) => plan.name.toLowerCase().includes(planQuery.toLowerCase())),
    [plans, planQuery]
  );

  function startCreate() {
    setCreating(true);
    setEditingId(null);
    setForm(toForm());
    setStatusMessage(null);
  }

  function startEdit(plan: PremiumPlan) {
    setCreating(false);
    setEditingId(plan.id);
    setForm(toForm(plan));
    setStatusMessage(null);
  }

  function cancelForm() {
    setCreating(false);
    setEditingId(null);
    setForm(toForm());
  }

  function buildPayload(formState: PlanForm) {
    return {
      id: formState.id.trim() || undefined,
      name: formState.name.trim(),
      description: formState.description.trim(),
      monthlyPrice: Number(formState.monthlyPrice),
      yearlyPrice: Number(formState.yearlyPrice),
      badge: formState.badge || null,
      features: formState.featuresText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      claimedListings: parseClaimLimitInput(formState.claimedListings),
      limits: {
        courses: parseClaimLimitInput(formState.courseEnrollments)
      },
      enabled: formState.enabled
    };
  }

  async function savePlan() {
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const payload = buildPayload(form);
      const isNew = creating;
      const response = await fetch(isNew ? "/api/admin/plans" : `/api/admin/plans/${editingId}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as { plan?: PremiumPlan; error?: string };
      if (!response.ok || !data.plan) {
        setStatusMessage(data.error ?? "Could not save plan.");
        return;
      }

      setPlans((current) => {
        if (isNew) {
          return [...current, data.plan!];
        }
        return current.map((plan) => (plan.id === data.plan!.id ? data.plan! : plan));
      });
      cancelForm();
      router.refresh();
      setStatusMessage(isNew ? "Plan created and synced to Stripe." : "Plan updated and synced to Stripe.");
    } catch {
      setStatusMessage("Could not save plan.");
    } finally {
      setIsSaving(false);
    }
  }

  async function syncAllPlans() {
    setIsSyncingAll(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/admin/plans/sync-all", { method: "POST" });
      const data = (await response.json()) as { count?: number; error?: string };
      if (!response.ok) {
        setStatusMessage(data.error ?? "Stripe sync failed.");
        return;
      }

      const refresh = await fetch("/api/admin/plans");
      const refreshData = (await refresh.json()) as { plans?: PremiumPlan[] };
      if (refreshData.plans) {
        setPlans(refreshData.plans);
      }

      router.refresh();
      setStatusMessage(`Synced ${data.count ?? 0} paid plan(s) to Stripe.`);
    } catch {
      setStatusMessage("Stripe sync failed.");
    } finally {
      setIsSyncingAll(false);
    }
  }

  async function deletePlan(plan: PremiumPlan) {
    const confirmed = window.confirm(`Delete ${plan.name}? Paid plans with subscriptions are disabled instead.`);
    if (!confirmed) {
      return;
    }

    setStatusMessage(null);

    try {
      const response = await fetch(`/api/admin/plans/${plan.id}`, { method: "DELETE" });
      const data = (await response.json()) as { deleted?: boolean; plan?: PremiumPlan; message?: string; error?: string };
      if (!response.ok) {
        setStatusMessage(data.error ?? "Delete failed.");
        return;
      }

      if (data.deleted) {
        setPlans((current) => current.filter((item) => item.id !== plan.id));
      } else if (data.plan) {
        setPlans((current) => current.map((item) => (item.id === data.plan!.id ? data.plan! : item)));
      }

      if (editingId === plan.id) {
        cancelForm();
      }

      router.refresh();
      setStatusMessage(data.message ?? "Plan removed.");
    } catch {
      setStatusMessage("Delete failed.");
    }
  }

  const showForm = creating || editingId !== null;

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-4">
        <div>
          <CardTitle>Premium package management</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Plans are stored in MySQL and synced to Stripe products and prices when you save.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={syncAllPlans} disabled={isSyncingAll}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncingAll ? "animate-spin" : ""}`} />
            {isSyncingAll ? "Syncing..." : "Sync all to Stripe"}
          </Button>
          <Button onClick={startCreate}>Create plan</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {statusMessage ? <p className="text-sm text-muted-foreground">{statusMessage}</p> : null}
        <Input placeholder="Search plans" value={planQuery} onChange={(event) => setPlanQuery(event.target.value)} className="max-w-sm" />

        {showForm ? (
          <div className="grid gap-4 rounded-md border p-4">
            <div className="grid gap-4 md:grid-cols-2">
              {creating ? (
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="plan-id">
                    Plan id
                  </label>
                  <Input
                    id="plan-id"
                    value={form.id}
                    onChange={(event) => setForm((current) => ({ ...current, id: event.target.value }))}
                    placeholder="starter"
                  />
                </div>
              ) : null}
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="plan-name">
                  Name
                </label>
                <Input id="plan-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Badge</label>
                <Select
                  value={form.badge || "none"}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, badge: value === "none" ? "" : (value as PlanForm["badge"]) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No badge" />
                  </SelectTrigger>
                  <SelectContent>
                    {badgeOptions.map((badge) => (
                      <SelectItem key={badge || "none"} value={badge || "none"}>
                        {badge || "No badge"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="plan-monthly">
                  Monthly price (USD)
                </label>
                <Input
                  id="plan-monthly"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.monthlyPrice}
                  onChange={(event) => setForm((current) => ({ ...current, monthlyPrice: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="plan-yearly">
                  Yearly price (USD)
                </label>
                <Input
                  id="plan-yearly"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.yearlyPrice}
                  onChange={(event) => setForm((current) => ({ ...current, yearlyPrice: event.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="plan-description">
                Description
              </label>
              <Textarea
                id="plan-description"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="plan-claims">
                  Claimed listings limit
                </label>
                <Input
                  id="plan-claims"
                  value={form.claimedListings}
                  onChange={(event) => setForm((current) => ({ ...current, claimedListings: event.target.value }))}
                  placeholder="6 or unlimited"
                />
                <p className="text-xs text-muted-foreground">Listings a founder can claim. Use a number or unlimited.</p>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="plan-courses">
                  Course enrollment limit
                </label>
                <Input
                  id="plan-courses"
                  value={form.courseEnrollments}
                  onChange={(event) => setForm((current) => ({ ...current, courseEnrollments: event.target.value }))}
                  placeholder="5 or unlimited"
                />
                <p className="text-xs text-muted-foreground">How many courses a member can enroll in (e.g. Starter = 5).</p>
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="plan-features">
                Features (one per line)
              </label>
              <Textarea
                id="plan-features"
                value={form.featuresText}
                onChange={(event) => setForm((current) => ({ ...current, featuresText: event.target.value }))}
                rows={5}
              />
            </div>
            <label className="flex items-center justify-between rounded-md border p-4">
              <span className="font-medium">Enabled on pricing page</span>
              <Switch checked={form.enabled} onCheckedChange={(checked) => setForm((current) => ({ ...current, enabled: checked }))} />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button onClick={savePlan} disabled={isSaving}>
                {isSaving ? "Saving..." : creating ? "Create & sync to Stripe" : "Save & sync to Stripe"}
              </Button>
              <Button variant="outline" onClick={cancelForm}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-3">
          {filteredPlans.map((plan, index) => {
            const status = stripeStatus(plan);
            return (
              <div key={plan.id} className="grid gap-3 rounded-md border p-4 md:grid-cols-[48px_1fr_auto] md:items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">{index + 1}</div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{plan.name}</span>
                    <span className="text-xs text-muted-foreground">({plan.id})</span>
                    {plan.badge ? <Badge variant="premium">{plan.badge}</Badge> : null}
                    <Badge variant={plan.enabled ? "verified" : "secondary"}>{plan.enabled ? "Enabled" : "Disabled"}</Badge>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${plan.monthlyPrice}/mo · ${plan.yearlyPrice}/yr ·{" "}
                    {plan.limits.claimedListings === "unlimited" || plan.limits.claimedListings === "Unlimited"
                      ? "Unlimited claims"
                      : `${plan.limits.claimedListings ?? 0} claims`}
                  </div>
                  {plan.stripeMonthlyPriceId ? (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {plan.stripeMonthlyPriceId} · {plan.stripeYearlyPriceId}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(plan)}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deletePlan(plan)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
