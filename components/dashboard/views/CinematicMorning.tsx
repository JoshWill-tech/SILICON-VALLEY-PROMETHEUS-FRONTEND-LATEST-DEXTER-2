"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Coffee, Sun } from "lucide-react";

export function CinematicMorning() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-chrome-radial">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,215,0,0.045),transparent_42%,rgba(0,240,255,0.025)_72%,transparent)]" />
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 1, ease: "easeOut" }}
          className="text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-accent-gold/20 bg-accent-gold-glow">
              <Sun className="h-8 w-8 text-accent-gold" />
            </div>
          </div>
          <h1 className="chrome-text mb-4 font-display text-5xl font-bold md:text-7xl">Good Morning</h1>
          <p className="mb-12 text-xl text-text-secondary">Your projects are waiting. Let&apos;s build something great.</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-accent-gold/20 bg-accent-gold-glow px-6 py-3 text-sm font-medium text-accent-gold transition-all hover:shadow-glow-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
            >
              <Coffee className="h-4 w-4" /> Continue Last Project
            </button>
            <button
              type="button"
              className="glass-button flex min-h-11 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-text-secondary transition-all hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
            >
              New Project <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
