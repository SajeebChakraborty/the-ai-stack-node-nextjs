"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ShieldCheck, Sparkles, TrendingUp, Zap } from "lucide-react";

const leaders = [
  { name: "StackPilot", growth: 42, score: 98 },
  { name: "PromptForge", growth: 35, score: 87 },
  { name: "ClipNova", growth: 61, score: 93 }
] as const;

export function Hero3DShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 140, damping: 18 });
  const springY = useSpring(rotateY, { stiffness: 140, damping: 18 });
  const glowX = useTransform(springY, [-12, 12], ["30%", "70%"]);
  const glowY = useTransform(springX, [-12, 12], ["20%", "80%"]);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const node = ref.current;
    if (!node) {
      return;
    }

    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(x * 24);
    rotateX.set(-y * 20);
  }

  function resetTilt() {
    rotateX.set(0);
    rotateY.set(0);
    setHovered(false);
  }

  return (
    <div className="relative mx-auto w-full max-w-lg px-1 [perspective:1200px] sm:px-0">
      <motion.div
        className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-primary/25 blur-3xl"
        style={{ left: glowX, top: glowY }}
        animate={{ opacity: hovered ? 0.9 : 0.45, scale: hovered ? 1.05 : 0.95 }}
        transition={{ duration: 0.35 }}
      />
      <motion.div
        ref={ref}
        className="home-3d-scene relative cursor-grab space-y-3 active:cursor-grabbing"
        style={{ rotateX: springX, rotateY: springY, transformStyle: "preserve-3d" }}
        onPointerMove={handlePointerMove}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={resetTilt}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          className="glass-panel flex w-full items-center justify-between gap-3 rounded-xl border border-primary/15 p-3 shadow-glow sm:max-w-[220px] sm:justify-self-end"
          style={{ translateZ: 60 }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="h-4 w-4 shrink-0 text-primary" />
            Live momentum
          </motion.div>
          <p className="shrink-0 text-2xl font-semibold text-primary">+61%</p>
        </motion.div>

        <motion.div
          className="glass-panel relative overflow-hidden rounded-2xl border border-primary/20 p-5 shadow-glow"
          style={{ translateZ: 40 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
          <div className="relative mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Live trust ranking</p>
              <h2 className="text-balance text-xl font-semibold leading-snug sm:text-2xl">
                Agentic SaaS Leaders
              </h2>
            </div>
            <motion.div
              className="shrink-0"
              animate={{ rotate: hovered ? 360 : 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <ShieldCheck className="h-9 w-9 text-primary" />
            </motion.div>
          </div>
          <div className="relative space-y-3">
            {leaders.map((leader, index) => (
              <motion.div
                key={leader.name}
                className="flex items-center justify-between gap-3 rounded-xl border bg-background/60 p-3 backdrop-blur"
                style={{ translateZ: 30 - index * 6 }}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.12, duration: 0.5 }}
                whileHover={{ scale: 1.02, borderColor: "hsl(var(--primary) / 0.45)" }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{leader.name}</div>
                    <div className="text-xs text-muted-foreground">Trust score {leader.score}</div>
                  </div>
                </div>
                <motion.div className="flex shrink-0 items-center gap-1 text-sm text-emerald-500">
                  <TrendingUp className="h-4 w-4" />
                  +{leader.growth}%
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="glass-panel flex w-fit items-center gap-2 self-end rounded-full px-4 py-2 text-sm shadow-glow"
          style={{ translateZ: 80 }}
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        >
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-medium">3D interactive preview</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
