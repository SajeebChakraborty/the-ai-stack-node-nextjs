"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform
} from "framer-motion";
import { Bot, BrainCircuit, Cpu, Database, Sparkles, Workflow, Zap } from "lucide-react";

type OrbitNode = {
  icon: typeof Bot;
  label: string;
};

const innerNodes: OrbitNode[] = [
  { icon: BrainCircuit, label: "Models" },
  { icon: Workflow, label: "Agents" },
  { icon: Database, label: "Data" }
];

const outerNodes: OrbitNode[] = [
  { icon: Bot, label: "Assistants" },
  { icon: Cpu, label: "Compute" },
  { icon: Zap, label: "Automation" },
  { icon: Sparkles, label: "Creative" }
];

function OrbitRing({
  nodes,
  radius,
  durationSeconds,
  reverse,
  reduceMotion
}: {
  nodes: OrbitNode[];
  radius: number;
  durationSeconds: number;
  reverse?: boolean;
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      className="absolute inset-0"
      style={{ transformStyle: "preserve-3d" }}
      animate={reduceMotion ? undefined : { rotate: reverse ? -360 : 360 }}
      transition={{ duration: durationSeconds, repeat: Infinity, ease: "linear" }}
    >
      {nodes.map((node, index) => {
        const angle = (index / nodes.length) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const Icon = node.icon;
        return (
          <motion.div
            key={node.label}
            className="absolute left-1/2 top-1/2"
            style={{ x, y, translateX: "-50%", translateY: "-50%" }}
          >
            {/* Counter-rotate so chips stay upright */}
            <motion.div
              className="group flex flex-col items-center gap-1"
              animate={reduceMotion ? undefined : { rotate: reverse ? 360 : -360 }}
              transition={{ duration: durationSeconds, repeat: Infinity, ease: "linear" }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-primary shadow-[0_0_20px_-4px_hsl(var(--primary)/0.6)] backdrop-blur-md">
                <Icon className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white/70 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                {node.label}
              </span>
            </motion.div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export function AiCoreShowcase({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), {
    stiffness: 150,
    damping: 18
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), {
    stiffness: 150,
    damping: 18
  });

  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    if (reduceMotion) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((event.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function handleLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`glow-card overflow-hidden p-5 sm:p-6 ${className ?? ""}`}
      style={{ perspective: 1200 }}
      initial={reduceMotion ? false : { opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">
          TheAiStack · Live Core
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          online
        </span>
      </div>

      <motion.div
        className="relative mx-auto mt-4 aspect-square w-full max-w-[360px]"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      >
        {/* Glow backdrop */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.35),transparent_60%)] blur-2xl" />

        {/* Static rings */}
        <div className="absolute inset-[6%] rounded-full border border-white/10" />
        <div className="absolute inset-[20%] rounded-full border border-white/10" />
        <div className="absolute inset-[34%] rounded-full border border-dashed border-white/10" />

        {/* Rotating dashed ring */}
        <motion.div
          className="absolute inset-[6%] rounded-full border border-dashed border-primary/30"
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />

        {/* Orbits with nodes */}
        <div className="absolute inset-0">
          <OrbitRing nodes={outerNodes} radius={138} durationSeconds={36} reduceMotion={reduceMotion} />
        </div>
        <div className="absolute inset-0">
          <OrbitRing nodes={innerNodes} radius={86} durationSeconds={24} reverse reduceMotion={reduceMotion} />
        </div>

        {/* Core */}
        <motion.div
          className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-primary via-primary to-rose-500 shadow-[0_0_60px_-6px_hsl(var(--primary)/0.9)]"
          animate={reduceMotion ? undefined : { scale: [1, 1.07, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-8 w-8 text-white" />
        </motion.div>
      </motion.div>

      <p className="mt-4 text-center text-sm text-white/60">
        Interactive AI core — move your cursor to explore the stack.
      </p>
    </motion.div>
  );
}
