import type { Metadata } from "next";
import { Check } from "lucide-react";
import { premiumPlans } from "@/data/catalog";
import { PlanActionButton } from "@/components/pricing/plan-action-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Premium plans for founders, creators, agencies, and enterprise AI companies on TheAiStack."
};

export default function PricingPage() {
  return (
    <div className="section-shell">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Premium packages</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal md:text-5xl">Turn AI discovery into a measurable growth channel.</h1>
        <p className="mt-4 text-muted-foreground">
          Dynamic plans support monthly and yearly billing, Stripe product and price IDs, feature access control, usage limits, coupons, taxes, and plan lifecycle changes.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        {premiumPlans.map((plan) => (
          <Card key={plan.id} className={plan.badge ? "border-primary shadow-glow" : ""}>
            <CardHeader>
              <div className="flex min-h-6 items-center justify-between gap-2">
                <CardTitle>{plan.name}</CardTitle>
                {plan.badge ? <Badge variant="premium">{plan.badge}</Badge> : null}
              </div>
              <div className="pt-4">
                <span className="text-4xl font-semibold">${plan.monthlyPrice}</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <PlanActionButton plan={plan} />
              <div className="space-y-2">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
