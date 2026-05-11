"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { HeroSearch } from "@/components/home/hero-search";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b bg-grid subtle-grid">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.14),transparent_34%),linear-gradient(to_bottom,hsl(var(--background)/0.2),hsl(var(--background)))]" />
      <div className="container relative grid min-h-[680px] items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-8">
          <div className="inline-flex items-center rounded-full border bg-background/70 px-3 py-1 text-sm text-muted-foreground backdrop-blur">
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            AI discovery, trust, media, and growth intelligence
          </div>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-normal md:text-7xl">
              The AI stack buyers trust before they buy.
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
              Discover verified tools, ranked reviews, creator-led videos, founder analytics, launch campaigns, and buyer-grade proof in one premium AI ecosystem.
            </p>
          </div>
          <HeroSearch />
          <div className="grid max-w-2xl grid-cols-3 gap-3 text-sm">
            {[
              ["18K+", "verified reviews"],
              ["4.8M", "monthly buyer signals"],
              ["$2.1M", "creator payouts tracked"]
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border bg-background/70 p-4 backdrop-blur">
                <div className="text-2xl font-semibold">{value}</div>
                <div className="text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, duration: 0.7 }} className="minimal-surface rounded-lg p-4">
          <div className="rounded-md border bg-background/80 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Live trust ranking</p>
                <h2 className="text-2xl font-semibold">Agentic SaaS Leaders</h2>
              </div>
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-3">
              {["StackPilot", "PromptForge", "ContractLens"].map((name, index) => (
                <div key={name} className="flex items-center justify-between rounded-md border bg-secondary/40 p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-sm font-semibold text-primary">{index + 1}</span>
                    <div>
                      <div className="font-medium">{name}</div>
                      <div className="text-xs text-muted-foreground">Verified reviews, creator proof, founder analytics</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-emerald-500">
                    <TrendingUp className="h-4 w-4" />
                    +{42 - index * 7}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
