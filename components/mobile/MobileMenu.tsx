"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Clock, Folder, HelpCircle, Settings, X } from "lucide-react";

import { useDeviceTier } from "@/hooks/useDeviceTier";

const items = [
  { label: "Projects", icon: Folder },
  { label: "Recent", icon: Clock },
  { label: "Settings", icon: Settings },
  { label: "Help", icon: HelpCircle },
];

export function MobileMenu({ onClose }: { onClose: () => void }) {
  const shouldReduceMotion = useReducedMotion();
  const tier = useDeviceTier();
  const panelClass =
    tier === "low"
      ? "border-l border-border-subtle bg-surface-elevated shadow-floating"
      : "glass-panel border-l border-border-subtle shadow-floating";

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
    >
      <motion.aside
        className={`${panelClass} absolute right-0 top-0 flex h-full w-72 flex-col p-5`}
        initial={shouldReduceMotion ? false : { x: "100%" }}
        animate={{ x: 0 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onMouseDown={(event) => event.stopPropagation()}
        aria-label="Mobile navigation"
      >
        <div className="mb-6 flex items-center justify-between">
          <span className="font-display text-sm font-semibold uppercase tracking-[0.24em] text-text-tertiary">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-text-tertiary transition-colors hover:bg-white/5 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-2" aria-label="Mobile primary">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                type="button"
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </motion.aside>
    </motion.div>
  );
}
