"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Command, Menu, Sparkles } from "lucide-react";

import { useDeviceTier } from "@/hooks/useDeviceTier";
import { LiquidChromeButton } from "@/components/ui/liquid-chrome-button";
import { AnimatedBlobMobile } from "./AnimatedBlobMobile";
import { CommandPalette } from "./CommandPalette";
import { MobileMenu } from "./MobileMenu";

export function MobileLanding() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const tier = useDeviceTier();
  const shouldReduceMotion = useReducedMotion();
  const mobileTier = useMemo(() => {
    if (tier === "high") return "premium";
    if (tier === "low") return "lite";
    return "standard";
  }, [tier]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.closest("button")) return;
      navigator.vibrate?.(10);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-chrome-950 text-text-primary">
      {mobileTier === "premium" && <AnimatedBlobMobile />}
      {mobileTier === "standard" && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-chrome-800/30 via-transparent to-chrome-700/20" aria-hidden />
      )}
      {mobileTier === "lite" && <div className="pointer-events-none absolute inset-0 bg-chrome-radial" aria-hidden />}

      <nav className="relative z-20 flex items-center justify-between p-6" aria-label="Mobile landing">
        <span className="chrome-text font-display text-xl font-bold">Prometheus</span>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="glass-button flex h-11 w-11 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-text-secondary" />
        </button>
      </nav>

      <div className="relative z-10 flex flex-1 flex-col justify-center px-6">
        <motion.h1
          initial={shouldReduceMotion || mobileTier === "lite" ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 font-display text-5xl font-bold leading-tight md:text-6xl"
        >
          Create stunning videos with <span className="text-accent-cyan">AI</span>
        </motion.h1>
        <motion.p
          initial={shouldReduceMotion || mobileTier === "lite" ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: mobileTier === "lite" ? 0 : 0.1 }}
          className="mb-10 text-lg leading-7 text-text-secondary"
        >
          Transform your ideas into professional videos in minutes
        </motion.p>
        <motion.div
          initial={shouldReduceMotion || mobileTier === "lite" ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: mobileTier === "lite" ? 0 : 0.2 }}
          className="flex flex-col gap-3"
        >
          <LiquidChromeButton
            type="button"
            variant="primary"
            size="lg"
            liquid
            magnetic
            ripple
            className="min-h-11 rounded-2xl px-6 py-4 text-base font-semibold text-accent-cyan"
            onClick={() => router.push("/signup")}
          >
            <Sparkles className="h-5 w-5" /> Get Started
          </LiquidChromeButton>
          <button
            type="button"
            className="glass-button flex min-h-11 items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-medium text-text-secondary transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
          >
            Watch Demo <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </div>

      <button
        type="button"
        onClick={() => setCmdOpen(true)}
        className="absolute bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full border border-accent-cyan/30 bg-accent-cyan-glow text-accent-cyan shadow-glow-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
        aria-label="Open command palette"
      >
        <Command className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}
        {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
