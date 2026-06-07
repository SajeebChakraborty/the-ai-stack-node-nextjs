import type { Metadata } from "next";
import { Check } from "lucide-react";
import { PlanActionButton } from "@/components/pricing/plan-action-button";
import { ImmersivePageHero } from "@/components/layout/immersive-page-hero";
import { ScrollReveal, StaggerItem, StaggerReveal } from "@/components/home/scroll-reveal";
import { SectionShell } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { getPublishedPremiumPlans } from "@/lib/queries/plans";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Premium plans for founders, creators, agencies, and enterprise AI companies on TheAiStack."
};

export default async function PricingPage() {
  const premiumPlans = await getPublishedPremiumPlans();

  return (
    <div className="dark landing-root min-h-screen overflow-x-hidden">
      <SectionShell className="py-10 md:py-14">
        <ImmersivePageHero
          align="center"
          eyebrow="Premium packages"
          title="Turn AI discovery into a measurable"
          accent="growth channel."
          description="Plans are managed in the admin console and billed through Stripe with monthly or yearly subscriptions."
        />

        <StaggerReveal
          className={cn(
            "grid gap-4",
            premiumPlans.length >= 5 ? "lg:grid-cols-5" : "md:grid-cols-2 xl:grid-cols-4"
          )}
        >
          {premiumPlans.map((plan) => (
            <StaggerItem key={plan.id} className="h-full">
              <div
                className={cn(
                  "glow-card glow-card-hover group relative flex h-full flex-col overflow-hidden p-6",
                  plan.badge && "border-primary/50 shadow-[0_0_0_1px_hsl(var(--primary)/0.35),0_24px_80px_-20px_hsl(var(--primary)/0.5)]"
                )}
              >
                {plan.badge ? (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/25 blur-3xl"
                  />
                ) : null}

                <div className="relative flex min-h-6 items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold text-white">{plan.name}</h3>
                  {plan.badge ? <Badge variant="premium">{plan.badge}</Badge> : null}
                </div>

                <div className="relative pt-4">
                  <span className="font-display text-4xl font-bold text-white">${plan.monthlyPrice}</span>
                  <span className="text-sm text-white/50">/month</span>
                </div>
                <p className="relative mt-2 text-sm text-white/60">{plan.description}</p>

                <div className="relative mt-5 space-y-4">
                  <PlanActionButton plan={plan} />
                  <div className="space-y-2 border-t border-white/10 pt-4">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2 text-sm text-white/75">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerReveal>

        <ScrollReveal direction="up" className="mt-10 text-center text-sm text-white/40">
          Cancel anytime · Secure billing via Stripe · Upgrade or downgrade whenever you need.
        </ScrollReveal>
      </SectionShell>
    </div>
  );
}
