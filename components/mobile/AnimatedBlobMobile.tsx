"use client";

import { motion, useReducedMotion } from "framer-motion";

export function AnimatedBlobMobile() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,240,255,0.12),rgba(255,215,0,0.06)_45%,transparent_72%)] blur-2xl" />
    );
  }

  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 -translate-y-1/2"
      animate={{ scale: [1, 1.12, 1], rotate: [0, 90, 0] }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    >
      <div className="h-full w-full rounded-full bg-gradient-to-br from-accent-cyan/15 via-accent-gold/10 to-accent-cyan/15 blur-3xl" />
    </motion.div>
  );
}
