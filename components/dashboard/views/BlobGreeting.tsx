"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Upload, Video } from "lucide-react";

function deterministicUnit(seed: number) {
  const value = Math.sin(seed * 78.233) * 19341.819;
  return value - Math.floor(value);
}

function buildNodes() {
  return Array.from({ length: 30 }, (_, index) => ({
    id: `n-${index}`,
    x: deterministicUnit(index + 1) * 800,
    y: deterministicUnit(index + 41) * 600,
  }));
}

function buildConnections() {
  const nodes = buildNodes();
  const connections: Array<{ id: string; d: string; delay: number }> = [];

  nodes.forEach((node, index) => {
    nodes.forEach((other, otherIndex) => {
      if (index >= otherIndex) return;
      const distance = Math.hypot(node.x - other.x, node.y - other.y);
      const seed = index * 97 + otherIndex * 13;
      if (distance < 120 && deterministicUnit(seed) > 0.58) {
        connections.push({
          id: `c-${index}-${otherIndex}`,
          d: `M${node.x.toFixed(1)},${node.y.toFixed(1)} L${other.x.toFixed(1)},${other.y.toFixed(1)}`,
          delay: deterministicUnit(seed + 9) * 10,
        });
      }
    });
  });

  return connections;
}

function NeuralPaths() {
  const shouldReduceMotion = useReducedMotion();
  const connections = useMemo(() => buildConnections(), []);

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-10" viewBox="0 0 800 600" aria-hidden>
      {connections.map((connection) => (
        <motion.path
          key={connection.id}
          d={connection.d}
          stroke="currentColor"
          strokeWidth="0.5"
          fill="none"
          initial={shouldReduceMotion ? false : { pathLength: 0, opacity: 0 }}
          animate={shouldReduceMotion ? { pathLength: 1, opacity: 0.25 } : { pathLength: [0, 1, 0], opacity: [0, 0.8, 0] }}
          transition={{ duration: shouldReduceMotion ? 0 : 6, delay: connection.delay, repeat: shouldReduceMotion ? 0 : Infinity, ease: "easeInOut" }}
        />
      ))}
    </svg>
  );
}

export function BlobGreeting() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-chrome-950">
      <NeuralPaths />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(0,240,255,0.035),transparent_38%,rgba(255,215,0,0.028)_68%,transparent)]" />
      <div className="relative z-10 flex flex-1 items-center justify-center px-4">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.h1
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 font-display text-4xl font-bold text-text-primary md:text-6xl"
          >
            Welcome back. What do you want to build today?
          </motion.h1>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button
              type="button"
              className="glass-button flex min-h-11 items-center justify-center gap-2 rounded-full px-8 py-4 text-lg font-semibold text-text-primary transition-all hover:border-accent-cyan/30 hover:shadow-glow-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
            >
              <Upload className="h-5 w-5" /> Upload Video
            </button>
            <button
              type="button"
              className="glass-button flex min-h-11 items-center justify-center gap-2 rounded-full border-accent-cyan/30 px-8 py-4 text-lg font-semibold text-accent-cyan transition-all hover:bg-accent-cyan-glow hover:shadow-glow-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
            >
              <Video className="h-5 w-5" /> Start from Scratch
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
