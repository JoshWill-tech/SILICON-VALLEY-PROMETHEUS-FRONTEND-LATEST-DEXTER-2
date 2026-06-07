"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";

function deterministicUnit(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function buildPaths() {
  const gridSize = 40;
  const paths: Array<{ id: string; d: string; delay: number }> = [];

  for (let x = 0; x < 20; x += 1) {
    for (let y = 0; y < 12; y += 1) {
      const seed = x * 31 + y * 17;
      if (deterministicUnit(seed) > 0.7) {
        paths.push({
          id: `g-${x}-${y}`,
          d: `M${x * gridSize},${y * gridSize} L${(x + 1) * gridSize},${y * gridSize} L${(x + 1) * gridSize},${(y + 1) * gridSize} L${x * gridSize},${(y + 1) * gridSize} Z`,
          delay: deterministicUnit(seed + 7) * 5,
        });
      }
    }
  }

  return paths;
}

function GeometricPaths() {
  const shouldReduceMotion = useReducedMotion();
  const paths = useMemo(() => buildPaths(), []);

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" viewBox="0 0 800 480" aria-hidden>
      {paths.map((path) => (
        <motion.path
          key={path.id}
          d={path.d}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          initial={shouldReduceMotion ? false : { pathLength: 0, opacity: 0 }}
          animate={shouldReduceMotion ? { pathLength: 1, opacity: 0.28 } : { pathLength: [0, 1, 0], opacity: [0, 0.6, 0] }}
          transition={{ duration: shouldReduceMotion ? 0 : 8, delay: path.delay, repeat: shouldReduceMotion ? 0 : Infinity, ease: "easeInOut" }}
        />
      ))}
    </svg>
  );
}

export function GeometricWorkspace() {
  const [message, setMessage] = useState("");
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-chrome-radial">
      <GeometricPaths />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-chrome-950/60 via-transparent to-chrome-950/60" />
      <div className="relative z-10 flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-3xl">
          <motion.h1
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="chrome-text mb-8 text-center font-display text-4xl font-bold md:text-6xl"
          >
            What would you like to create today?
          </motion.h1>
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.2 }}
            className="relative"
          >
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-r from-accent-cyan/10 via-accent-gold/10 to-accent-cyan/10 blur-xl" />
            <div className="glass-panel relative flex items-center gap-2 rounded-3xl border border-border-subtle p-2 shadow-glass">
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Describe your video project..."
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-lg text-text-primary placeholder:text-text-tertiary focus:outline-none"
                aria-label="Describe your video project"
              />
              <button
                type="button"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-accent-cyan to-accent-cyan-dim text-chrome-950 shadow-glow-cyan transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
                aria-label="Generate project plan"
              >
                <Sparkles className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
